// Minimal ZIP writer for "Save all cards". Files are stored as they are (PNGs are already compressed).

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export const crc32 = (data: Uint8Array) => {
  let c = ~0;
  for (const b of data) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};

export function zip(files: { name: string; data: Uint8Array<ArrayBuffer> }[]): Blob {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const local: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  for (const f of files) {
    const name = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    // The fields local and central headers share: version 2.0, UTF-8 names, stored, time, date, crc, sizes, name length
    const common = (v: DataView, at: number) => {
      [20, 0x0800, 0, time, date].forEach((x, i) => v.setUint16(at + i * 2, x, true));
      [crc, f.data.length, f.data.length].forEach((x, i) => v.setUint32(at + 10 + i * 4, x, true));
      v.setUint16(at + 22, name.length, true);
    };
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    common(head, 4);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    common(entry, 6);
    entry.setUint32(42, offset, true);
    local.push(head, name, f.data);
    central.push(entry, name);
    offset += 30 + name.length + f.data.length;
  }
  const size = central.reduce((n, p) => n + (p as DataView | Uint8Array).byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...local, ...central, end], { type: 'application/zip' });
}

if (import.meta.env?.DEV) {
  console.assert(crc32(new TextEncoder().encode('123456789')) === 0xcbf43926, 'crc32 check value');
}
