// Fits an image onto a canvas of exact dimensions, for Marketplace listing assets
// that demand precise sizes (hero 960x600, highlights 1840x900).
//
//   node scripts/fit-image.mjs in.png out.png 960x600 [--bg RRGGBB] [--cover]
//
// The image is scaled to fit inside the canvas without distortion and centred.
// Leftover space uses --bg, defaulting to the source's top-left pixel so that
// screenshots on a light background letterbox invisibly. --cover fills the canvas
// instead, cropping the overflow.
//
// No image libraries: PNG is decoded and re-encoded here (8-bit, non-interlaced,
// colour type 2 or 6).
import { inflateSync, deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let width = 0, height = 0, depth = 0, colour = 0, interlace = 0;
  const idat = [];
  let palette = null, trns = null;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colour = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') trns = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }

  if (depth !== 8) throw new Error(`unsupported bit depth ${depth}, need 8`);
  if (interlace !== 0) throw new Error('interlaced PNG not supported');

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colour];
  if (!channels) throw new Error(`unsupported colour type ${colour}`);
  if (colour === 3 && !palette) throw new Error('indexed PNG without palette');

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Undo per-scanline filtering.
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }

  // Normalise everything to RGB.
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    let r, g, b;
    if (colour === 0 || colour === 4) r = g = b = out[i * channels];
    else if (colour === 3) {
      const idx = out[i] * 3;
      r = palette[idx]; g = palette[idx + 1]; b = palette[idx + 2];
    } else {
      r = out[i * channels]; g = out[i * channels + 1]; b = out[i * channels + 2];
    }
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
  }
  return { width, height, rgb };
}

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

function encodePng(width, height, rgb) {
  const out = Buffer.alloc(height * (width * 3 + 1));
  let o = 0;
  for (let y = 0; y < height; y++) {
    out[o++] = 0;
    rgb.copy(out, o, y * width * 3, (y + 1) * width * 3);
    o += width * 3;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(out, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Bilinear sample of the source at fractional coordinates.
function sample(src, sx, sy) {
  const x0 = Math.max(0, Math.min(src.width - 1, Math.floor(sx)));
  const y0 = Math.max(0, Math.min(src.height - 1, Math.floor(sy)));
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const fx = sx - x0, fy = sy - y0;
  const at = (x, y, k) => src.rgb[(y * src.width + x) * 3 + k];
  const out = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const top = at(x0, y0, k) * (1 - fx) + at(x1, y0, k) * fx;
    const bot = at(x0, y1, k) * (1 - fx) + at(x1, y1, k) * fx;
    out[k] = Math.round(top * (1 - fy) + bot * fy);
  }
  return out;
}

const [, , inPath, outPath, dims, ...rest] = process.argv;
if (!inPath || !outPath || !dims) {
  console.error('usage: node scripts/fit-image.mjs in.png out.png WIDTHxHEIGHT [--bg RRGGBB] [--cover]');
  process.exit(1);
}

const [W, H] = dims.split('x').map(Number);
const cover = rest.includes('--cover');
const bgArg = rest[rest.indexOf('--bg') + 1];

const src = decodePng(readFileSync(inPath));
const bg = rest.includes('--bg')
  ? [0, 2, 4].map((i) => parseInt(bgArg.slice(i, i + 2), 16))
  : [src.rgb[0], src.rgb[1], src.rgb[2]]; // top-left pixel

const scale = cover
  ? Math.max(W / src.width, H / src.height)
  : Math.min(W / src.width, H / src.height);
const dw = src.width * scale, dh = src.height * scale;
const ox = (W - dw) / 2, oy = (H - dh) / 2;

const dst = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const sx = (x - ox) / scale, sy = (y - oy) / scale;
    if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) {
      dst[i] = bg[0]; dst[i + 1] = bg[1]; dst[i + 2] = bg[2];
    } else {
      const [r, g, b] = sample(src, sx, sy);
      dst[i] = r; dst[i + 1] = g; dst[i + 2] = b;
    }
  }
}

writeFileSync(outPath, encodePng(W, H, dst));
console.log(`${inPath} (${src.width}x${src.height}) -> ${outPath} (${W}x${H})`);
