# ThunderCard

Make War Thunder vehicle stat cards that look like the in-game tooltip.

**Use it online:** https://hans21223.github.io/thundercard/

- **Load from game** — pick any of ~1,200 ground vehicles; name, BR, rank, weapons, mobility, economy and recon drone are filled in from the game files (build 2.59).
- Edit anything else by hand: armor types, systems, visibility, fire rate, owned / locked / premium / pack states. Fields auto-format when you leave them — type `130 38 50` and get `130 / 38 / 50 mm`.
- **Tech tree** — browse each nation's real research tree and open any vehicle's card, or build your own tree (copy the game's, add your mockups, move them around, folders) and save it as PNG / JSON.
- Upload your own flag.
- **Sprocket** — pick your Sprocket faction folder (or single `.blueprint` files) to make cards from your designs: mass, crew, guns, ammo, shell types, gun elevation, engine and top speed come from the blueprint, the picture from the design's side view. Add a whole faction as its own tech tree nation. `node tools/check_sprocket.mjs <Vehicles folder>` prints what each blueprint yields.
- **Copy image** to paste straight into Discord, or save PNG / JPG. **Save JSON** to share an editable card.

Card colors, font sizes and spacing are measured against in-game captures (`public/assets/sample/`).

## Run locally

```
npm install
npm run dev
```

Or double-click `run_app.bat`. `run_standalone_server.bat` serves a built `dist/` with Python.

## Updating game data

`tools/build_vehicle_db.py` regenerates `public/assets/game/vehicles.json` from the unpacked game files (`extracted_game/`, not in the repo). Unpack with [wt_ext_cli](https://github.com/Warthunder-Open-Source-Foundation/wt_ext_cli):

```
wt_ext_cli unpack_vromf -i "<War Thunder>/char.vromfs.bin" -o extracted_game/char --continue Quiet
python tools/build_vehicle_db.py
```

The script checks its output against the in-game HSTV-L card and fails if the numbers drift.

Pushing to `main` rebuilds and redeploys the site.

---

Like ThunderCard? Support my work by playing my game [Sakura Requiem](https://hans21223.itch.io/sakurarequiem).

Fan project, not affiliated with Gaijin Entertainment. Vehicle images, flags, icons and fonts are from War Thunder and belong to Gaijin Entertainment.
