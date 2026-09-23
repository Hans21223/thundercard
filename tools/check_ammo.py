"""Regression checks for multi-caliber Ammo rows. Run from any directory with Python."""
import json
import os
import unittest
from unittest.mock import patch

import build_vehicle_db as db


class AmmoRowsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.L = db.lang(*sorted(f for f in os.listdir(db.LANG) if f.endswith('.csv')))
        cls.mods = db.load(os.path.join(db.CHAR, 'modifications.blk'))['modifications']

    def vehicle(self, uid):
        tank = db.load(os.path.join(db.ACES, 'gamedata/units/tankmodels', uid + '.blk'))
        return db.ammo_rows(db.as_list(tank['commonWeapons']['Weapon']), tank['modifications'], self.mods, self.L)

    def test_surblinde_secondary_cannon_and_mixed_belt(self):
        rows = self.vehicle('fr_amx_50_surblinde')
        self.assertEqual([(r['caliber'], r['types']) for r in rows], [
            ('120 mm', ['120 mm Obus de rupture', '120 mm Obus explosif']),
            ('20 mm', ['20 mm FI-T', '20 mm AP-I']),
        ])

    def test_pbv_cannon_and_bill_missile(self):
        rows = self.vehicle('sw_pbv_302_bill')
        self.assertEqual([(r['caliber'], r['types']) for r in rows], [
            ('20 mm', ['20 mm AP-T', '20 mm HEFI-T', 'slpprj m/68']),
            ('150 mm', ['RB 56 BILL II']),
        ])

    def test_hstv_does_not_gain_machinegun_rows(self):
        self.assertEqual(self.vehicle('us_hstv_l'), [
            {'id': 'ammo_1', 'caliber': '75 mm', 'types': ['XM885', 'XM884']},
        ])

    def test_grouping_deduplication_and_hidden_defaults(self):
        blocks = {
            'one': {'bullet': {'caliber': .02, 'bulletName': 'a', 'bulletType': 'ap'}},
            'two': {'notUseDefaultBulletInGui': True,
                    'bullet': {'caliber': .02, 'bulletName': 'hidden', 'bulletType': 'he'},
                    'shell_effect': {'bullet': [{'caliber': .02, 'bulletName': 'a', 'bulletType': 'ap'},
                                               {'caliber': .02, 'bulletName': 'b', 'bulletType': 'he'}]}},
        }
        with patch.object(db, 'weapon_blk', side_effect=blocks.get):
            rows = db.ammo_rows([{'blk': 'one'}, {'blk': 'one'}, {'blk': 'two'}, {'blk': 'two', 'dummy': True}],
                                ['shell_mod'], {'shell_mod': {'effects': {'bulletMod': 'shell_effect'}}},
                                {'a': 'A', 'he/name/short': 'HE'})
        self.assertEqual(rows, [{'id': 'ammo_1', 'caliber': '20 mm', 'types': ['A', '20 mm HE']}])

    def test_machinegun_only_fallback(self):
        with patch.object(db, 'weapon_blk', return_value={'bullet': [
                {'caliber': .00762, 'bulletType': 'ap'}, {'caliber': .00762, 'bulletType': 't'}]}):
            rows = db.ammo_rows([{'blk': 'mg'}], [], {}, {'ap/name/short': 'AP', 't/name/short': 'T'})
        # The in-game row label floors caliber, but each mixed-belt item retains its actual caliber.
        self.assertEqual(rows[0]['caliber'], '7 mm')
        self.assertEqual(rows[0]['types'], ['7.62 mm AP', '7.62 mm T'])

    def test_generated_catalog_contains_the_rows(self):
        data = db.load(os.path.join(db.PUB, 'assets/game/vehicles.json'))
        cards = {v['card']['id']: v['card'] for v in data['vehicles']}
        for uid in ['fr_amx_50_surblinde', 'sw_pbv_302_bill', 'us_hstv_l']:
            self.assertEqual(cards[uid]['ammoRows'], self.vehicle(uid))
        for card in cards.values():
            rows = card['ammoRows']
            self.assertEqual(len({r['caliber'] for r in rows}), len(rows), card['id'])
            self.assertTrue(all(r['types'] and all(isinstance(t, str) for t in r['types']) for r in rows), card['id'])


if __name__ == '__main__':
    unittest.main()
