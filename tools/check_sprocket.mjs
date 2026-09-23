// Runs the Sprocket blueprint parser over a folder and prints what the stat card would get.
// Usage: node tools/check_sprocket.mjs "<...>/Sprocket/Factions/<faction>/Blueprints/Vehicles"
import { build } from 'esbuild';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';

const out = await build({ entryPoints: ['src/utils/sprocket.ts'], bundle: true, format: 'esm', platform: 'node', write: false });
const { parseBlueprint } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));

const dir = process.argv[2];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.blueprint'))) {
  try {
    const s = parseBlueprint(readFileSync(join(dir, f), 'utf8'));
    const g = s.guns[0];
    console.log(
      f.padEnd(44),
      `${(s.massKg / 1000).toFixed(1)} t`.padStart(7),
      `crew ${s.crew}`.padEnd(8),
      (g ? `${g.name} x${g.count} ${g.rounds} rds ${g.shells.join('/')} ${g.elevation ? g.elevation.join('/') + '°' : ''}` : 'no gun').padEnd(52),
      s.engine ? `${s.engine.liters.toFixed(1)} L ${s.engine.rpm} rpm` : '',
      s.speed ? `${s.speed.forward}/${s.speed.reverse} km/h` : ''
    );
    if (f === 'XE-769A.blueprint') {
      assert.equal(s.crew, 4);
      assert.equal(g.caliber, 120);
      assert.equal(g.rounds, 8); // one 480×240×800 rack of 120 mm × 800 mm shells
      assert.deepEqual(s.speed, { forward: 33.9, reverse: 5.7 }); // 2400 rpm, top gear 1.0, reverse 6.0, final drive 10, 0.75 m sprocket
    }
  } catch (e) {
    console.log(f.padEnd(44), 'ERROR', e.message);
    if (e instanceof assert.AssertionError) process.exitCode = 1;
  }
}
