// Generates a 144x144 PNG app logo with no image libraries.
// Renders 4x supersampled, downsamples for antialiasing, then hand-encodes the PNG.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 144;
const S = 4;                 // supersample factor
const BIG = SIZE * S;

const BG = [15, 23, 42];     // slate-900
const ACCENT = [244, 114, 182]; // pink, a nod to Mermaid
const NODE = [226, 232, 240];   // slate-200
const LINE = [100, 116, 139];   // slate-500

const buf = new Uint8Array(BIG * BIG * 3);
for (let i = 0; i < BIG * BIG; i++) {
  buf[i * 3] = BG[0];
  buf[i * 3 + 1] = BG[1];
  buf[i * 3 + 2] = BG[2];
}

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= BIG || y >= BIG) return;
  const i = (y * BIG + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

// Rounded rectangle, coordinates in 144-space, centred on (cx, cy).
function roundRect(cx, cy, w, h, r, c) {
  const x0 = (cx - w / 2) * S, x1 = (cx + w / 2) * S;
  const y0 = (cy - h / 2) * S, y1 = (cy + h / 2) * S;
  const rr = r * S;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const dx = Math.max(x0 + rr - x, 0, x - (x1 - rr));
      const dy = Math.max(y0 + rr - y, 0, y - (y1 - rr));
      if (dx * dx + dy * dy <= rr * rr) px(x, y, c);
    }
  }
}

// Thick line segment, coordinates in 144-space.
function line(ax, ay, bx, by, width, c) {
  const x0 = ax * S, y0 = ay * S, x1 = bx * S, y1 = by * S;
  const w = (width * S) / 2;
  const vx = x1 - x0, vy = y1 - y0;
  const len2 = vx * vx + vy * vy;
  const minX = Math.floor(Math.min(x0, x1) - w), maxX = Math.ceil(Math.max(x0, x1) + w);
  const minY = Math.floor(Math.min(y0, y1) - w), maxY = Math.ceil(Math.max(y0, y1) + w);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let t = ((x - x0) * vx + (y - y0) * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px_ = x0 + t * vx, py_ = y0 + t * vy;
      const dx = x - px_, dy = y - py_;
      if (dx * dx + dy * dy <= w * w) px(x, y, c);
    }
  }
}

// Connectors first so the nodes sit on top of them.
line(72, 44, 38, 100, 5, LINE);
line(72, 44, 106, 100, 5, LINE);

roundRect(72, 40, 56, 28, 9, ACCENT);
roundRect(38, 104, 46, 26, 8, NODE);
roundRect(106, 104, 46, 26, 8, NODE);

// Downsample SxS blocks by averaging.
const out = Buffer.alloc(SIZE * (SIZE * 3 + 1));
let o = 0;
for (let y = 0; y < SIZE; y++) {
  out[o++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < S; sy++) {
      for (let sx = 0; sx < S; sx++) {
        const i = ((y * S + sy) * BIG + (x * S + sx)) * 3;
        r += buf[i]; g += buf[i + 1]; b += buf[i + 2];
      }
    }
    const n = S * S;
    out[o++] = Math.round(r / n);
    out[o++] = Math.round(g / n);
    out[o++] = Math.round(b / n);
  }
}

// --- PNG container ---
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 2;   // colour type: truecolour RGB
ihdr[10] = 0;  // deflate
ihdr[11] = 0;  // adaptive filtering
ihdr[12] = 0;  // no interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(out, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(process.argv[2] || 'logo.png', png);
console.log('written:', process.argv[2], png.length, 'bytes');
