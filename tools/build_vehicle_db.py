"""Build public/assets/game/vehicles.json from the unpacked War Thunder files.

Needs extracted_game/{aces,char,lang}. char is unpacked with:
  tools/wt_ext_cli/wt_ext_cli.exe unpack_vromf -i "<WT>/char.vromfs.bin" -o extracted_game/char --continue Quiet
Run: .venv/Scripts/python.exe tools/build_vehicle_db.py
"""
import csv, json, math, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EX = os.path.join(ROOT, 'extracted_game')
CHAR = os.path.join(EX, 'char/char.vromfs.bin_u/config')
ACES = os.path.join(EX, 'aces/aces.vromfs.bin_u')
LANG = os.path.join(EX, 'lang/lang.vromfs.bin_u/lang')
PUB = os.path.join(ROOT, 'public')
WT_CHAR = r'D:\SteamLibrary\steamapps\common\War Thunder\char.vromfs.bin'

MODES = {'realistic': 'Historical', 'arcade': 'Arcade', 'simulator': 'Simulation'}
CLASSES = [('type_light_tank', 'light_tank', 'Light Tank'), ('type_medium_tank', 'medium_tank', 'Medium Tank'),
           ('type_heavy_tank', 'heavy_tank', 'Heavy Tank'), ('type_tank_destroyer', 'destroyer_tank', 'Tank Destroyer'),
           ('type_spaa', 'spaa_tank', 'SPAA')]
ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
# ponytail: stock-crew multiplier calibrated from one in-game capture (HSTV-L); use crew_skills.blk if other tanks drift
STOCK_CREW_TURRET = 0.7
STOCK_CREW_RELOAD = 1.3


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def lang(*files):
    out = {}
    for name in files:
        with open(os.path.join(LANG, name), encoding='utf-8', newline='') as f:
            for row in csv.reader(f, delimiter=';'):
                if len(row) > 1:
                    out[row[0].lower()] = row[1]
    return out


def as_list(x):
    return x if isinstance(x, list) else [] if x is None else [x]


def num(n):
    return f'{int(n):,}'


def half_up(x, nd=1):
    return f'{math.floor(round(x * 10 ** nd, 6) + 0.5) / 10 ** nd:.{nd}f}'


def duration(hrs):
    """In-game style: '14d 06h 21m', '15d 21m', '18h 57m' — zero parts are dropped."""
    m = int(round(hrs * 60, 6))
    parts = []
    for value, unit in ((m // 1440, 'd'), (m // 60 % 24, 'h'), (m % 60, 'm')):
        if value:
            parts.append(f'{value:02d}{unit}' if parts else f'{value}{unit}')
    return ' '.join(parts) or '0m'


def caliber(mm):
    return f'{mm:g} mm'


def weapon_blk(path):
    p = os.path.join(ACES, path.lower())
    return load(p) if os.path.exists(p) else {}


def ammo_names(wblk, tank_mods, L):
    """Shell names the game lists under 'Ammo NN mm:' — default shell + researched belts."""
    names = []
    bullets = [] if wblk.get('notUseDefaultBulletInGui') else as_list(wblk.get('bullet'))
    for key, val in wblk.items():
        if key in tank_mods and isinstance(val, dict):
            bullets += as_list(val.get('bullet'))
    for b in bullets:
        n = L.get(str(b.get('bulletName', '')).lower(), b.get('bulletName'))
        if n and n not in names:
            names.append(n)
    return names


def build():
    wp, tags = load(os.path.join(CHAR, 'wpcost.blk')), load(os.path.join(CHAR, 'unittags.blk'))
    mods_db = load(os.path.join(CHAR, 'modifications.blk'))['modifications']
    free_repairs = str(load(os.path.join(CHAR, 'warpoints.blk')).get('freeRepairs', ''))
    L = lang('units.csv', 'units_weaponry.csv', 'menu.csv', 'menu_options.csv')
    max_rank = max(u.get('rank', 0) for u in wp.values() if isinstance(u, dict))

    out = []
    for uid, u in wp.items():
        model = os.path.join(ACES, 'gamedata/units/tankmodels', uid + '.blk')
        image = f'assets/game/tanks/{uid.lower()}.avif'
        if not isinstance(u, dict) or u.get('unitMoveType') not in ('tank', 'heavy_tank', 'wheeled_vehicle') \
                or not os.path.exists(model) or not os.path.exists(os.path.join(PUB, image)):
            continue
        t = load(model)
        tg = tags.get(uid, {})
        cls = next((c for c in CLASSES if tg.get('tags', {}).get(c[0])), CLASSES[1])
        flag = next(f'assets/game/flags/{c}.avif' for c in (tg.get('operatorCountry'), u['country'], 'country_usa')
                    if c and os.path.exists(os.path.join(PUB, f'assets/game/flags/{c}.avif')))
        tank_mods = t.get('modifications') or {}

        # Stock mod penalties (invertEnableLogic mods apply until researched)
        pen = {'mulSpeedYaw': 1.0, 'mulSpeedPitch': 1.0}
        for m in tank_mods:
            d = mods_db.get(m, {})
            if d.get('invertEnableLogic'):
                for k in pen:
                    pen[k] *= d.get('effects', {}).get(k, 1.0)

        weapons = [w for w in as_list((t.get('commonWeapons') or {}).get('Weapon'))
                   if w.get('bullets') and 'dummy' not in w.get('blk', '')]
        primary, secondary, ammo, cal = None, {}, [], ''
        if weapons:
            p = weapons[0]
            pblk = weapon_blk(p['blk'])
            key = os.path.splitext(os.path.basename(p['blk']))[0]
            primary = {'id': 'pw1', 'name': L.get('weapons/' + key.lower(), key), 'ammo': p['bullets']}
            ammo = ammo_names(pblk, tank_mods, L)
            b0 = next(iter(as_list(pblk.get('bullet'))), {})
            cal = caliber(round(b0.get('caliber', 0) * 1000, 2)) if b0.get('caliber') else ''
            for w in weapons[1:]:
                key = os.path.splitext(os.path.basename(w['blk']))[0]
                s = secondary.setdefault(key, {'id': f'sw{len(secondary) + 1}',
                                               'name': L.get('weapons/' + key.lower(), key), 'ammo': 0, 'count': 0})
                s['count'] += 1
                s['ammo'] += w['bullets']
                s['prefix'] = f"{s['count']}x" if s['count'] > 1 else ''
        yaw, pitch = (u.get('turretSpeed') or [0, 0])[:2]
        lo, hi = (weapons[0].get('limits', {}).get('pitch') if weapons else None) or [0.0, 0.0]

        phys = t.get('VehiclePhys', {})
        eng, mech = phys.get('engine', {}), phys.get('mechanics', {})
        ratios = as_list((mech.get('gearRatios') or {}).get('ratio'))
        def speed(r):
            final = abs(r) * mech.get('mainGearRatio', 1.0) * mech.get('sideGearRatio', 1.0)
            return eng.get('maxRPM', 0) / final * 2 * math.pi * mech.get('driveGearRadius', 0) * 0.06
        fwd = [r for r in ratios if r > 0]
        rev = [r for r in ratios if r < 0]

        reload = u.get('reloadTime_cannon')
        auto = u.get('primaryWeaponAutoLoader')
        r = u.get('rank', 1)
        gold = u.get('costGold')
        req = u.get('reqAir')
        ace_h, ace_v = yaw * pen['mulSpeedYaw'], pitch * pen['mulSpeedPitch']
        drone = t.get('supportPlane') or {}

        card = {
            'id': uid,
            'name': L.get(uid.lower() + '_0', uid),
            'vehicleClass': cls[1],
            'typeLabel': cls[2],
            'rank': ROMAN[r],
            'countryFlag': flag,
            'vehicleImage': image,
            'statusType': 'premium' if gold else 'standard',
            'primaryWeapon': primary or {'id': 'pw1', 'name': '', 'ammo': ''},
            'secondaryWeapons': list(secondary.values()),
            'guidanceSpeedHorStock': half_up(ace_h * STOCK_CREW_TURRET),
            'guidanceSpeedHorAce': half_up(ace_h),
            'guidanceSpeedVertStock': half_up(ace_v * STOCK_CREW_TURRET),
            'guidanceSpeedVertAce': half_up(ace_v),
            'verticalGuidance': f'{(lo or 0.0):.1f} / {hi:+.1f}°',
            'reloadingRate': f'{reload * (1 if auto else STOCK_CREW_RELOAD):.1f} s' if reload else '',
            'reloadingRateAce': f'{reload:.1f} s' if reload and not auto else '',
            'uavName': f"{L['mainmenu/type_drone']} {L.get(drone.get('supportPlaneClass', '').lower() + '_shop', '')}"
                       if drone else '',
            'uavRecon': f"{drone.get('count', 1)}{L['measureunits/pcs']}" if drone else '',
            'ammoTypes': ammo,
            'ammoCaliber': cal,
            'crew': u.get('crewTotalCount', ''),
            'mass': half_up(phys.get('Mass', {}).get('TakeOff', t.get('mass', 0)) / 1000) + ' t',
            'enginePower': f"{eng.get('horsePowers', 0):g} hp at {eng.get('maxRPM', 0):g} rpm",
            'maxSpeedForward': f'{speed(min(fwd)):.1f}' if fwd else '',
            'maxSpeedReverse': f'{speed(max(rev)):.1f}' if rev else '',
            'requiredRP': num(u['reqExp']) if u.get('reqExp') else '',
            'efficientProgressFrom': L.get(req.lower() + '_shop', req) if req else '',
            'price': num(gold) if gold else num(u['value']) if u.get('value') else '',
            'priceCurrency': 'ge' if gold else 'sl',
            'crewTrainCost': num(u.get('trainCost', 0)),
            'freeRepairs': free_repairs,
            'researchEfficiencyRanks': f'{ROMAN[max(1, r - 1)]} – {ROMAN[min(max_rank, r + 1)]} Ranks',
            'rpRewardPercent': f"{round(u.get('expMul', 1) * 100)}%",
            'rpMultiplier': f"{u.get('expMul', 1):g}×(100%)",
        }
        modes = {}
        for mode, sfx in MODES.items():
            mul = u.get('rewardMul' + sfx, 1)
            cost = u.get('repairCost' + sfx, 0)
            modes[mode] = {
                'battleRating': f"{u.get('economicRank' + sfx, 0) / 3 + 1:.1f}",
                'repairCostPerMin': num(u.get('repairCostPerMin' + sfx, 0)),
                'maxRepairCost': num(cost) if cost else 'Free',
                'freeRepairTime': duration(u.get('repairTimeHrs' + sfx, 0)),
                'slRewardPercent': f'{round(mul * 100)}%',
                'slMultiplier': f'{mul:g}×(100%)',
            }
        out.append({'short': L.get(uid.lower() + '_shop', uid), 'country': u['country'], 'card': card, 'modes': modes})

    out.sort(key=lambda v: (v['country'], v['modes']['realistic']['battleRating'], v['short']))
    return out


def version():
    try:
        r = subprocess.run([os.path.join(ROOT, 'tools/wt_ext_cli/wt_ext_cli.exe'), 'vromf_version', '-i', WT_CHAR],
                           capture_output=True, text=True, timeout=60)
        return json.loads(r.stdout)[0]['char.vromfs.bin']
    except Exception:
        return ''


if __name__ == '__main__':
    vehicles = build()
    by_id = {v['card']['id']: v for v in vehicles}

    # Check against the in-game HSTV-L capture (public/assets/sample/hstvl_statcard_reference.png)
    h = {**by_id['us_hstv_l']['card'], **by_id['us_hstv_l']['modes']['realistic']}
    expect = {'battleRating': '12.0', 'rank': 'VII', 'mass': '20.0 t', 'maxSpeedForward': '83.1',
              'maxSpeedReverse': '24.4', 'guidanceSpeedHorStock': '33.9', 'guidanceSpeedHorAce': '48.5',
              'guidanceSpeedVertStock': '31.9', 'guidanceSpeedVertAce': '45.6', 'verticalGuidance': '-17.0 / +45.0°',
              'reloadingRate': '1.0 s', 'requiredRP': '350,000', 'price': '950,000', 'crewTrainCost': '270,000',
              'repairCostPerMin': '976', 'maxRepairCost': '3,550', 'freeRepairTime': '14d 06h 21m',
              'rpMultiplier': '2.44×(100%)', 'ammoTypes': ['XM885', 'XM884'], 'crew': 3,
              'efficientProgressFrom': 'M10 Booker', 'researchEfficiencyRanks': 'VI – VIII Ranks',
              'uavName': 'UAV Recon Micro', 'uavRecon': '1pcs'}
    bad = {k: (h.get(k), v) for k, v in expect.items() if h.get(k) != v}
    assert not bad, f'HSTV-L mismatch (got, expected): {bad}'
    assert h['primaryWeapon'] == {'id': 'pw1', 'name': '75 mm ADMAG cannon', 'ammo': 26}, h['primaryWeapon']
    assert h['secondaryWeapons'] == [{'id': 'sw1', 'name': '7.62 mm M240 machine gun', 'ammo': 3200, 'count': 2, 'prefix': '2x'}], \
        h['secondaryWeapons']

    assert duration(15 * 24 + 21 / 60) == '15d 21m' and duration(18 + 57 / 60) == '18h 57m', 'duration format'

    dest = os.path.join(PUB, 'assets/game/vehicles.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump({'version': version(), 'vehicles': vehicles}, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(vehicles)} vehicles -> {dest} ({os.path.getsize(dest) // 1024} KB)')
