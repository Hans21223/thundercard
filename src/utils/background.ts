// Cut-out tools for the background remover (components/ImageEditor.tsx).
// The tools place markers on the picture (1 = keep, 2 = remove, 0 = not decided); segment() grows them into
// the selection mask (1 = keep); cutOut() clears the rest.

export interface Pixels {
  data: Uint8ClampedArray; // RGBA
  w: number;
  h: number;
}

// Colour difference between pixels i and j, 0–255. Colours are weighted by opacity so empty pixels all match.
const diff = (d: Uint8ClampedArray, i: number, j: number) => {
  const [a, b] = [d[i * 4 + 3], d[j * 4 + 3]];
  const dr = (d[i * 4] * a - d[j * 4] * b) / 255;
  const dg = (d[i * 4 + 1] * a - d[j * 4 + 1] * b) / 255;
  const db = (d[i * 4 + 2] * a - d[j * 4 + 2] * b) / 255;
  return Math.min(255, Math.round(Math.sqrt(dr * dr + dg * dg + db * db + (a - b) ** 2) / 2));
};

// The 4 neighbours of pixel i
const around = (i: number, w: number, n: number) => {
  const x = i % w;
  return [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w < n ? i + w : -1];
};

// Magic wand: the area connected to `seed` whose colour is within tolerance (0–100) of the seed's
export function magicWand({ data, w, h }: Pixels, seed: number, tolerance: number): Uint8Array {
  const n = w * h;
  const out = new Uint8Array(n);
  const stack = [seed];
  out[seed] = 1;
  while (stack.length) {
    for (const j of around(stack.pop()!, w, n)) {
      if (j < 0 || out[j] || diff(data, seed, j) > tolerance * 2.55) continue;
      out[j] = 1;
      stack.push(j);
    }
  }
  return out;
}

// Quick selection: keep and remove markers grow over the picture, always taking the smallest colour step
// next, so the two sides meet where the colour changes most, the vehicle's outline (a marker watershed).
// With no remove markers, border pixels close in colour to a corner count as background (so a vehicle
// touching the edge stays); with no keep markers, all but the removed pixels are kept.
export function segment({ data, w, h }: Pixels, markers: Int8Array): Uint8Array {
  const n = w * h;
  const mask = new Uint8Array(n);
  if (!markers.includes(1)) {
    for (let i = 0; i < n; i++) mask[i] = markers[i] === 2 ? 0 : 1;
    return mask;
  }
  const label = Int8Array.from(markers);
  if (!markers.includes(2)) {
    const corners = [0, w - 1, n - w, n - 1];
    for (let i = 0; i < n; i++) {
      const x = i % w;
      const edge = x === 0 || x === w - 1 || i < w || i >= n - w;
      if (edge && !label[i] && corners.some((c) => diff(data, c, i) <= 38)) label[i] = 2; // 38 ≈ 15%
    }
  }

  // Bucket queue by colour step; an entry is pixel * 2 + (label - 1)
  const buckets: number[][] = Array.from({ length: 256 }, () => []);
  let level = 256;
  const spread = (i: number) => {
    for (const j of around(i, w, n)) {
      if (j < 0 || label[j]) continue;
      const k = diff(data, i, j);
      buckets[k].push(j * 2 + label[i] - 1);
      if (k < level) level = k;
    }
  };
  for (let i = 0; i < n; i++) if (label[i]) spread(i);
  while (level < 256) {
    const e = buckets[level].pop();
    if (e === undefined) {
      level++;
      continue;
    }
    const j = e >> 1;
    if (label[j]) continue;
    label[j] = (e & 1) + 1;
    spread(j);
  }
  for (let i = 0; i < n; i++) mask[i] = label[i] === 1 ? 1 : 0;
  return mask;
}

// The picture with everything outside the mask cleared (the kept edge fades over 1 px, no background halo),
// and the box around what is left [x0, y0, x1, y1], or null when nothing is left.
export function cutOut({ data, w, h }: Pixels, mask: Uint8Array): { data: Uint8ClampedArray<ArrayBuffer>; box: number[] } | null {
  const out = new Uint8ClampedArray(data);
  const box = [w, h, -1, -1];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) {
        out[(y * w + x) * 4 + 3] = 0;
        continue;
      }
      let [sum, count] = [0, 0];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const [xx, yy] = [x + dx, y + dy];
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += mask[yy * w + xx];
          count++;
        }
      const i = y * w + x;
      out[i * 4 + 3] = Math.round((data[i * 4 + 3] * sum) / count);
      if (out[i * 4 + 3]) [box[0], box[1], box[2], box[3]] = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
    }
  return box[2] < 0 ? null : { data: out, box };
}

// Reads a picture's pixels, scaled down to fit maxW × maxH. Throws for pictures linked from another site.
export async function loadPixels(src: string, maxW = 1200, maxH = 600): Promise<Pixels> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((done, fail) => {
    img.onload = done;
    img.onerror = fail;
    img.src = src;
  });
  const k = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const [w, h] = [Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k)];
  const ctx = Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

if (import.meta.env?.DEV) {
  // 6×4 picture: white background, red vehicle (with a lighter red panel) touching the bottom edge
  const [W, R, P] = [[255, 255, 255, 255], [200, 0, 0, 255], [230, 60, 60, 255]];
  const rows = [
    [W, W, W, W, W, W],
    [W, R, R, P, W, W],
    [W, R, P, P, R, W],
    [W, R, R, R, R, W],
  ];
  const pix = { data: new Uint8ClampedArray(rows.flat(2)), w: 6, h: 4 };
  const at = (x: number, y: number) => y * 6 + x;
  const wand = magicWand(pix, at(1, 1), 10);
  console.assert(wand[at(1, 3)] === 1 && wand[at(2, 2)] === 0 && wand[at(0, 0)] === 0, 'wand takes the red only', wand);
  // One keep stroke on the red: the whole vehicle including the panel, nothing of the background
  const markers = new Int8Array(24);
  markers[at(1, 2)] = 1; // no remove marks: the white border is the background, the red bottom edge is not
  const mask = segment(pix, markers);
  const kept = [...mask].flatMap((m, i) => (m ? [i] : []));
  const vehicle = rows.flatMap((row, y) => row.flatMap((c, x) => (c === W ? [] : [at(x, y)])));
  console.assert(kept.join() === vehicle.join(), 'quick selection snaps to the outline', kept, vehicle);
  const cut = cutOut(pix, mask)!;
  console.assert(cut.box.join() === '1,1,4,3' && cut.data[at(0, 0) * 4 + 3] === 0, 'cut out and cropped', cut.box);
}
