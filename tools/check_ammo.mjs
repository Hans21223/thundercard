// No new test dependencies: exercise the saved-card compatibility and the actual card renderer.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const out = await build({
  stdin: { contents: `export * from './src/utils/ammo'; export * from './src/utils/share';
    export * from './src/components/StatCard/ModernStatCard'; export * from './src/data/gameVehicles';
    export { VEHICLE_PRESETS } from './src/data/presets';
    export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`,
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'esm', write: false,
  packages: 'external',
});
// Resolve external React imports from this project's installed dependencies.
const { writeFileSync, unlinkSync } = await import('node:fs');
const tmp = new URL('./.ammo-check.mjs', import.meta.url);
writeFileSync(tmp, out.outputFiles[0].text);
try {
  const { getAmmoRows, ammoUpdates, ammoLabel, ModernStatCard, gameToVehicle, VEHICLE_PRESETS,
    createElement, renderToStaticMarkup, cardLink, cardFromLink } = await import(tmp.href);
  const old = { ...VEHICLE_PRESETS.find(v => v.id === 'us_hstv_l') ?? VEHICLE_PRESETS[0],
    ammoTypes: ['XM885', 'XM884'], ammoCaliber: '75 mm' };
  assert.equal(getAmmoRows(old)[0].caliber, '75 mm');
  assert.deepEqual(getAmmoRows(old)[0].types, ['XM885', 'XM884']);
  assert.equal(ammoLabel(''), 'Ammo:');
  const updated = { ...old, ...ammoUpdates([
    ...getAmmoRows(old), { id: 'secondary', caliber: '20 mm', types: ['HEFI-T', 'AP-T'] },
  ]) };
  const html = renderToStaticMarkup(createElement(ModernStatCard, { vehicle: updated }));
  for (const text of ['Ammo 75 mm:', 'Ammo 20 mm:', 'HEFI-T', 'AP-T']) assert.ok(html.includes(text), text);
  assert.deepEqual(getAmmoRows(JSON.parse(JSON.stringify(updated))), updated.ammoRows);
  globalThis.location = { origin: 'http://localhost:5173', pathname: '/' };
  const shared = await cardFromLink(new URL((await cardLink(updated)).url).hash);
  assert.deepEqual(shared.ammoRows, updated.ammoRows);
  const removed = { ...updated, ...ammoUpdates([]) };
  assert.deepEqual(getAmmoRows(removed), []);
  assert.deepEqual(removed.ammoTypes, []);
  assert.ok(!renderToStaticMarkup(createElement(ModernStatCard, { vehicle: removed })).includes('Ammo 20 mm:'));
  const empty = { ...updated, ...ammoUpdates([{ id: 'empty', caliber: '30 mm', types: [] }]) };
  assert.ok(!renderToStaticMarkup(createElement(ModernStatCard, { vehicle: empty })).includes('Ammo 30 mm:'));
  const db = JSON.parse(readFileSync('public/assets/game/vehicles.json', 'utf8'));
  for (const [uid, labels] of [
    ['fr_amx_50_surblinde', ['Ammo 120 mm:', 'Ammo 20 mm:']],
    ['sw_pbv_302_bill', ['Ammo 20 mm:', 'Ammo 150 mm:']],
    ['us_hstv_l', ['Ammo 75 mm:']],
  ]) {
    const card = gameToVehicle(db.vehicles.find(v => v.card.id === uid), 'realistic', db.version);
    const rendered = renderToStaticMarkup(createElement(ModernStatCard, { vehicle: card }));
    for (const label of labels) assert.ok(rendered.includes(label), uid + ' ' + label);
    assert.ok(!rendered.includes('Ammo 7 mm:'), 'No MG row alongside cannon');
  }
  console.log('Ammo checks passed: legacy saves, multiple rows, JSON/share round trips, hidden rows, game loading and card rendering.');
} finally { unlinkSync(tmp); }
