import { VehicleData } from '../types/vehicle';

// Share links: the card, compressed, in the page address after "#card=". Uploaded pictures are too big
// for a link, so a card with one is shared without it (Save JSON keeps everything).

const MAX_LINK_DATA = 6000; // characters; longer links break in chat apps

const toBase64Url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const pack = async (card: VehicleData) => {
  const deflated = new Blob([JSON.stringify(card)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toBase64Url(new Uint8Array(await new Response(deflated).arrayBuffer()));
};

export async function cardLink(v: VehicleData): Promise<{ url: string; picturesLeftOut: boolean }> {
  let data = await pack(v);
  const picturesLeftOut = data.length > MAX_LINK_DATA;
  if (picturesLeftOut) {
    const keep = (src: string) => (src.startsWith('data:') ? '' : src);
    data = await pack({ ...v, vehicleImage: keep(v.vehicleImage), countryFlag: keep(v.countryFlag) });
  }
  return { url: `${location.origin}${location.pathname}#card=${data}`, picturesLeftOut };
}

// The card in a "#card=…" address, or null. Only plain card fields are taken; the caller fills in the rest.
export async function cardFromLink(hash: string): Promise<Partial<VehicleData> | null> {
  if (!hash.startsWith('#card=')) return null;
  try {
    const inflated = new Blob([fromBase64Url(hash.slice(6))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const card = JSON.parse(await new Response(inflated).text());
    if (typeof card !== 'object' || !card || typeof card.name !== 'string') return null;
    if (!Array.isArray(card.secondaryWeapons)) delete card.secondaryWeapons;
    if (!Array.isArray(card.ammoTypes)) delete card.ammoTypes;
    if (!Array.isArray(card.ammoRows)) delete card.ammoRows;
    if (typeof card.primaryWeapon !== 'object' || !card.primaryWeapon) delete card.primaryWeapon;
    return card;
  } catch {
    return null;
  }
}
