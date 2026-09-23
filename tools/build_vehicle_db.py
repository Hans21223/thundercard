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
# Protection row, same order as gui scripts/unit/unitProtection.nut
ARMOR_TYPES = ['hasNoArmor', 'hasSteelArmor', 'hasSpallLiner', 'hasNBCLiner', 'hasCompositeArmor', 'hasAluminiumArmor',
               'hasArtilleryProtection', 'hasReinforcedHullProtection', 'hasLocalHullProtection', 'hasCitadel',
               'hasAntiTorpedoProtection', 'hasLocalSideProtection', 'hasFullSideProtection',
               'hasReinforcedInternalProtection', 'hasLocalInternalProtection']
PROTECTION_BY_CLASS = {'type_light_tank': 'bullet_proof_lite', 'type_medium_tank': 'projectile_proof_medium',
                       'type_heavy_tank': 'projectile_proof_heavy', 'type_missile_tank': 'splinter_proof_rocket',
                       'type_tank_destroyer': 'projectile_proof_sau', 'type_spaa': 'bullet_proof_lite'}


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


def ammo_rows(weapons, tank_mods, mods_db, L):
    """Port unitBullets.nut: all cannon weapons (guns only if no cannon), grouped by caliber.

    weaponryInfo.nut classifies cannon at >=15 mm, including gun-style ATGM launchers.
    Mixed belts display '<caliber> <short bullet type>'; single shells use their localized name.
    Repeated mounts and duplicate default/researched rounds are listed only once.
    """
    mod_names = set(tank_mods)
    for name in tank_mods:
        effects = (mods_db.get(name) or {}).get('effects') or {}
        for key in ('additiveBulletMod', 'bulletMod'):
            if isinstance(effects.get(key), str):
                mod_names.add(effects[key])

    guns, cannons = [], []
    for w in weapons:
        if w.get('dummy') or not w.get('blk'):
            continue
        wb = weapon_blk(w['blk'])
        if any(wb.get(k) for k in ('rocketGun', 'bombGun', 'torpedoGun')):
            continue
        bullets = as_list(wb.get('bullet'))
        if bullets:
            (cannons if bullets[0].get('caliber', 0) * 1000 >= 15 else guns).append(wb)

    rows, seen = {}, set()
    for wb in cannons or guns:
        sets = [] if wb.get('notUseDefaultBulletInGui') else [as_list(wb.get('bullet'))]
        sets += [as_list(v.get('bullet')) for k, v in wb.items()
                 if k != 'bullet' and k in mod_names and isinstance(v, dict)]
        for bullets in sets:
            for b in bullets:
                # The JSON unpacker stores repeated BLK parameters as lists; named BLK lookup uses the first.
                name = next(iter(as_list(b.get('bulletName'))), '')
                kind = next(iter(as_list(b.get('bulletType'))), '')
                mm = b.get('caliber', 0) * 1000
                key = (name, kind)
                if not mm or key in seen:
                    continue
                seen.add(key)
                if len(bullets) > 1:
                    label = f"{caliber(mm)} {L.get((kind + '/name/short').lower(), kind)}"
                else:
                    label = L.get(name.lower(), name)
                if not label:
                    continue
                cal = caliber(math.floor(mm))
                row = rows.setdefault(cal, {'id': f'ammo_{len(rows) + 1}', 'caliber': cal, 'types': []})
                row['types'].append(label)
    return list(rows.values())


def blk_file(path):
    p = os.path.join(ACES, (path or '').lower())
    return load(p) if path and os.path.exists(p) else {}


def protection(t, tg, statcard, L):
    """(armor lines, protection class lines) — port of gui scripts/unit/unitProtection.nut."""
    armor = [L[f'info/material/{a}'.lower()] for a in ARMOR_TYPES if a in statcard]
    armor += [L.get(f'armor_class/{e}'.lower(), e) for e in as_list(statcard.get('eraType'))]
    tag_set = tg.get('tags', {})
    level = (tg.get('Shop') or {}).get('mainArmorProtectionLevel') or next(
        (v for k, v in PROTECTION_BY_CLASS.items() if tag_set.get(k)), None)
    rating = [L.get(f'info/material/{level}'.lower(), level)] if level else []
    aps = (t.get('ActiveProtectionSystem') or {}).get('model')
    if tag_set.get('has_aps') and aps:
        rating.append(L['info/apsname'].replace('{name}', L.get(f'aps/{aps}'.lower(), aps)))
    return '\n'.join(armor), '\n'.join(rating)


def systems(u, t, mods_db, L):
    """'Laser rangefinder, NVD, …' — port of gui scripts/unit/unitSystems.nut (ground vehicles)."""
    items, seen = [], set()

    def add_mod(key, loc_key=None):
        if key not in seen:
            seen.add(key)
            items.append([L.get(f'modification/{loc_key or key}'.lower(), loc_key or key), 1])

    tank_mods = t.get('modifications') or {}
    for m in u.get('modifications') or tank_mods:
        eff = (mods_db.get(m) or {}).get('effects') or {}
        lws = any(blk_file(x.get('blk')).get('type') == 'lws' for x in as_list((eff.get('sensors') or {}).get('sensor')))
        if lws or eff.get('smokeScreenCount', 0) > 0 or any(
                eff.get(e) is True for e in ('enableNightVision', 'diggingAvailable', 'rangefinderMounted')):
            add_mod(m)

    weapons = as_list((t.get('commonWeapons') or {}).get('Weapon'))
    for m in tank_mods.values():
        weapons += as_list((((m or {}).get('effects') or {}).get('commonWeapons') or {}).get('Weapon'))
    if any(isinstance(w, dict) and w.get('triggerGroup') == 'smoke' for w in weapons):
        add_mod('smoke_grenade', 'tank_smoke_screen_system_mod')

    antennas = {}  # the game counts antennas per sensor file: "2x Search radar antenna"
    for sensor in as_list((t.get('sensors') or {}).get('sensor')):
        blk = blk_file(sensor.get('blk'))
        if blk.get('type') == 'radar' and blk.get('name') == 'Auto tracker':
            items.append([L['info/att'], 1])
        for part in as_list(sensor.get('dmPart')):
            kind = next((k for k in ('antenna_target_location', 'antenna_target_tagging') if k in part), None)
            if kind and sensor['blk'] in antennas:
                antennas[sensor['blk']][1] += 1
            elif kind:
                antennas[sensor['blk']] = [L[f'armor_class/{kind}'], 1]
                items.append(antennas[sensor['blk']])
    return ', '.join(name if n == 1 else f'{n}x {name}' for name, n in items)


def shop_kind(entry, u):
    """How the game's tree shows a vehicle: squadron (green), event/marketplace (blue, Ⓖ), pack, premium (GE price)."""
    if entry.get('isClanVehicle'):
        return 'squadron'
    if entry.get('event') or entry.get('marketplaceItemdefId'):
        return 'event'
    if entry.get('gift'):
        return 'pack'
    return 'premium' if u.get('costGold') else 'standard'


def tech_trees(shop, have, wp, L):
    """Ground research trees from shop.blk → ({country: columns}, {vehicle id: shop kind}).
    column = [{ids, link, name?}]; more than one id = a folder (name from shop/group/<key>).
    link: researched from the entry above it (reqAir "" breaks the chain, as in premium columns).
    Vehicles the game only shows once bought (event versions, launcher parts…) are left out, as in-game."""
    trees, kinds = {}, {}
    for country, branches in shop.items():
        cols = []
        for col in as_list(((branches or {}).get('army') or {}).get('range')):
            entries = []
            for key, v in col.items():
                members = {k: sub for k, sub in v.items() if isinstance(sub, dict)} or {key: v}
                for m in members:
                    if m in have:
                        kinds[m] = shop_kind(members[m], wp[m])
                if v.get('showOnlyWhenBought'):
                    continue
                ids = [m for m in members if m in have and not members[m].get('showOnlyWhenBought')]
                if ids:
                    entry = {'ids': ids, 'link': bool(entries) and v.get('reqAir') != ''}
                    if len(ids) > 1:
                        entry['name'] = L.get(f'shop/group/{key}'.lower(), '/'.join(have[i]['short'] for i in ids))
                    entries.append(entry)
            if entries:
                cols.append(entries)
        trees[country] = cols
    return trees, kinds


def build():
    wp, tags = load(os.path.join(CHAR, 'wpcost.blk')), load(os.path.join(CHAR, 'unittags.blk'))
    mods_db = load(os.path.join(CHAR, 'modifications.blk'))['modifications']
    free_repairs = str(load(os.path.join(CHAR, 'warpoints.blk')).get('freeRepairs', ''))
    statcards = load(os.path.join(ACES, 'config/statcard_info.blk'))
    L = lang(*sorted(f for f in os.listdir(LANG) if f.endswith('.csv')))
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
        armor, armor_class = protection(t, tg, statcards.get(uid) or {}, L)
        shop = tg.get('Shop') or {}

        card = {
            'id': uid,
            'name': L.get(uid.lower() + '_0') or uid,
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
            'protectionSummary': armor,
            'bulletproofRating': armor_class,
            **{f'{part}Armor': ' / '.join(f'{x:g}' for x in thick) + ' mm'  # Simple card: front / side / rear
               for part, thick in (('hull', shop.get('armorThicknessHull')), ('turret', shop.get('armorThicknessTurret')))
               if thick},
            'systems': systems(u, t, mods_db, L),
            'ammoTypes': ammo,
            'ammoCaliber': cal,
            'ammoRows': ammo_rows(weapons, u.get('modifications') or tank_mods, mods_db, L),
            'crew': u.get('crewTotalCount', ''),
            'mass': half_up(phys.get('Mass', {}).get('TakeOff', t.get('mass', 0)) / 1000) + ' t',
            'enginePower': f"{round(eng.get('horsePowers', 0))} hp at {round(eng.get('maxRPM', 0))} rpm",
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
        out.append({'short': L.get(uid.lower() + '_shop') or uid, 'country': u['country'], 'card': card, 'modes': modes})

    out.sort(key=lambda v: (v['country'], v['modes']['realistic']['battleRating'], v['short']))
    by_id = {v['card']['id']: v for v in out}
    trees, kinds = tech_trees(load(os.path.join(CHAR, 'shop.blk')), by_id, wp, L)
    for uid, kind in kinds.items():
        by_id[uid]['card']['statusType'] = kind
    return out, trees


def version():
    try:
        r = subprocess.run([os.path.join(ROOT, 'tools/wt_ext_cli/wt_ext_cli.exe'), 'vromf_version', '-i', WT_CHAR],
                           capture_output=True, text=True, timeout=60)
        return json.loads(r.stdout)[0]['char.vromfs.bin']
    except Exception:
        return ''


if __name__ == '__main__':
    vehicles, trees = build()
    by_id = {v['card']['id']: v for v in vehicles}
    us = trees['country_usa']
    assert us[0][0] == {'ids': ['us_m2a4'], 'link': False} and us[0][-1]['ids'] == ['us_hstv_l'], us[0][:2]
    assert {'ids': ['us_m4a1_1942_sherman', 'us_m4_sherman', 'us_m4a2_sherman'], 'link': True,
            'name': 'M4A1/M4/M4A2'} in us[1], us[1][:3]

    # Check against the in-game HSTV-L capture (public/assets/sample/hstvl_statcard_reference.png)
    h = {**by_id['us_hstv_l']['card'], **by_id['us_hstv_l']['modes']['realistic']}
    expect = {'battleRating': '12.0', 'rank': 'VII', 'mass': '20.0 t', 'maxSpeedForward': '83.1',
              'maxSpeedReverse': '24.4', 'guidanceSpeedHorStock': '33.9', 'guidanceSpeedHorAce': '48.5',
              'guidanceSpeedVertStock': '31.9', 'guidanceSpeedVertAce': '45.6', 'verticalGuidance': '-17.0 / +45.0°',
              'reloadingRate': '1.0 s', 'requiredRP': '350,000', 'price': '950,000', 'crewTrainCost': '270,000',
              'repairCostPerMin': '976', 'maxRepairCost': '3,550', 'freeRepairTime': '14d 06h 21m',
              'rpMultiplier': '2.44×(100%)', 'ammoTypes': ['XM885', 'XM884'], 'crew': 3,
              'efficientProgressFrom': 'M10 Booker', 'researchEfficiencyRanks': 'VI – VIII Ranks',
              'uavName': 'UAV Recon Micro', 'uavRecon': '1pcs', 'protectionSummary': 'Aluminum armor',
              'bulletproofRating': 'Bullet proof', 'systems': 'Laser rangefinder, NVD, Smoke grenade, Auto tracker'}
    bad = {k: (h.get(k), v) for k, v in expect.items() if h.get(k) != v}
    assert not bad, f'HSTV-L mismatch (got, expected): {bad}'
    assert h['primaryWeapon'] == {'id': 'pw1', 'name': '75 mm ADMAG cannon', 'ammo': 26}, h['primaryWeapon']
    assert h['secondaryWeapons'] == [{'id': 'sw1', 'name': '7.62 mm M240 machine gun', 'ammo': 3200, 'count': 2, 'prefix': '2x'}], \
        h['secondaryWeapons']

    # Other in-game captures (XM975, M163)
    for uid, want in {'us_xm_975_roland': ('Steel armor\nAluminum armor', 'Bullet proof',
                                           'Search radar antenna, Tracking radar director'),
                      'us_m163_vulcan': ('Aluminum armor', 'Bullet proof', 'Tracking radar director')}.items():
        c = by_id[uid]['card']
        got = (c['protectionSummary'], c['bulletproofRating'], c['systems'])
        assert got == want, f'{uid}: got {got}, expected {want}'
    assert duration(15 * 24 + 21 / 60) == '15d 21m' and duration(18 + 57 / 60) == '18h 57m', 'duration format'

    dest = os.path.join(PUB, 'assets/game/vehicles.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump({'version': version(), 'vehicles': vehicles, 'trees': trees}, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(vehicles)} vehicles -> {dest} ({os.path.getsize(dest) // 1024} KB)')
