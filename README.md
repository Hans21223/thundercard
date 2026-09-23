# ThunderCard

Make War Thunder vehicle stat cards that look like the in-game tooltip.

**Use it online:** https://hans21223.github.io/thundercard/

- **Load from game** — pick any of ~1,200 ground vehicles; name, BR, rank, weapons, mobility, economy and recon drone are filled in from the game files (build 2.59).
- Edit anything else by hand: armor types, systems, visibility, fire rate, owned / locked / premium / pack states. Fields auto-format when you leave them — type `130 38 50` and get `130 / 38 / 50 mm`.
- **Tech tree** — browse each nation's real research tree and open any vehicle's card, or build your own tree (copy the game's, add your mockups, move them around, folders) and save it as PNG / JSON.
- Upload, paste (Ctrl+V) or drop a vehicle picture; pictures are shrunk to what the card needs. Upload your own flag. Hover the vehicle picture on the card for a Photoshop-style transform box: drag to move, corners scale (Shift: freely), sides stretch.
- **Remove background** (Appearance tab): Quick selection brush that snaps to the vehicle's outline, Magic wand, keep / remove modes; the result is cropped to the vehicle.
- **Auto-save** (Settings): edits go into the Library save you opened, or into the Library's Autosave folder. Saves live in the browser's IndexedDB (hundreds of MB, not localStorage's 5 MB); the Library searches and shows pictures.
- In your own tree, a vehicle moved into a premium column becomes premium, and one moved out becomes a normal researchable vehicle. A resizable card sidebar holds your saved cards to drag in; Delete / arrow keys / Ctrl+D remove, move and duplicate the selected vehicle. **Save all cards** zips every vehicle's card as PNG.
- **Sprocket** — pick your Sprocket faction folder (or single `.blueprint` files) to make cards from your designs: mass, crew, guns, ammo, shell types, gun elevation, engine and top speed come from the blueprint, the picture from the design's side view. Add a whole faction as its own tech tree nation. `node tools/check_sprocket.mjs <Vehicles folder>` prints what each blueprint yields.
- **Copy image** to paste straight into Discord, or save PNG / JPG (1×, 2× or 4×, in Settings). **Copy link** shares the card as a link; **Save JSON** shares an editable card with its uploaded pictures.

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
