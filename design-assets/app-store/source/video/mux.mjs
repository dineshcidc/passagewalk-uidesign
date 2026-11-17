// Mux: CFR H.264 samples (WebCodecs, avc format) + AAC audio track taken from the MediaRecorder MP4
// -> progressive MP4 (ftyp, interleaved mdat, moov). No re-encode.
import { readFileSync, writeFileSync } from "node:fs";

const [, , VBIN, VJSON, AUDIO_SRC, OUT] = process.argv;
const vbin = readFileSync(VBIN), vmeta = JSON.parse(readFileSync(VJSON, "utf8")), abuf = readFileSync(AUDIO_SRC);

// ---------- read audio samples + trak from the fragmented source ----------
const CONT = new Set(["moov", "trak", "mdia", "minf", "stbl", "mvex", "moof", "traf", "edts", "dinf", "udta"]);
function parse(buf, off, end) {
  const list = [];
  while (off < end) {
    let size = buf.readUInt32BE(off), hdr = 8; const type = buf.toString("latin1", off + 4, off + 8);
    if (size === 1) { size = Number(buf.readBigUInt64BE(off + 8)); hdr = 16; } else if (size === 0) size = end - off;
    const bx = { type, start: off, body: off + hdr, end: off + size }; if (CONT.has(type)) bx.children = parse(buf, bx.body, bx.end);
    list.push(bx); off += size;
  }
  return list;
}
const find = (list, ...path) => { let cur = { children: list }; for (const t of path) { cur = cur.children?.find((b) => b.type === t); if (!cur) return null; } return cur; };
const findAll = (list, t) => list.filter((b) => b.type === t);
const aroot = parse(abuf, 0, abuf.length), amoov = find(aroot, "moov");
const atrak = findAll(amoov.children, "trak").find((t) => find(t.children, "mdia", "minf", "smhd"));
const atkhd = find(atrak.children, "tkhd"); const aId = abuf.readUInt32BE(atkhd.body + (abuf[atkhd.body] ? 20 : 12));
const trex = findAll(find(amoov.children, "mvex").children, "trex").map((t) => ({ id: abuf.readUInt32BE(t.body + 4), dur: abuf.readUInt32BE(t.body + 12), size: abuf.readUInt32BE(t.body + 16) })).find((t) => t.id === aId);
const aS = [];
for (const moof of findAll(aroot, "moof")) for (const traf of findAll(moof.children, "traf")) {
  const th = find(traf.children, "tfhd"), tf = abuf.readUInt32BE(th.body) & 0xffffff; let p = th.body + 4;
  const id = abuf.readUInt32BE(p); p += 4; if (id !== aId) continue;
  let base = moof.start, dDur = trex.dur, dSize = trex.size;
  if (tf & 0x01) { base = Number(abuf.readBigUInt64BE(p)); p += 8; } if (tf & 0x02) p += 4;
  if (tf & 0x08) { dDur = abuf.readUInt32BE(p); p += 4; } if (tf & 0x10) { dSize = abuf.readUInt32BE(p); p += 4; } if (tf & 0x20) p += 4;
  for (const tr of findAll(traf.children, "trun")) {
    const f = abuf.readUInt32BE(tr.body) & 0xffffff; let q = tr.body + 4; const n = abuf.readUInt32BE(q); q += 4;
    let off = base; if (f & 0x01) { off = base + abuf.readInt32BE(q); q += 4; } if (f & 0x04) q += 4;
    for (let i = 0; i < n; i++) {
      const dur = f & 0x100 ? abuf.readUInt32BE((q += 4) - 4) : dDur; const size = f & 0x200 ? abuf.readUInt32BE((q += 4) - 4) : dSize;
      if (f & 0x400) q += 4; if (f & 0x800) q += 4;
      aS.push({ data: abuf.subarray(off, off + size), dur }); off += size;
    }
  }
}
const amdhd = find(atrak.children, "mdia", "mdhd"); const aTs = abuf.readUInt32BE(amdhd.body + (abuf[amdhd.body] ? 20 : 12));

// ---------- writers ----------
const box = (type, ...parts) => { const body = Buffer.concat(parts); const h = Buffer.alloc(8); h.writeUInt32BE(8 + body.length); h.write(type, 4, "latin1"); return Buffer.concat([h, body]); };
const u32 = (...v) => { const b = Buffer.alloc(4 * v.length); v.forEach((x, i) => b.writeUInt32BE(x >>> 0, i * 4)); return b; };
const u16 = (...v) => { const b = Buffer.alloc(2 * v.length); v.forEach((x, i) => b.writeUInt16BE(x & 0xffff, i * 2)); return b; };
const full = (type, ver, flags, ...parts) => box(type, u32(((ver & 0xff) << 24) | flags), ...parts);
const zeros = (n) => Buffer.alloc(n);
const MATRIX = u32(0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000);
const MOVIE_TS = 1000;

// video samples (CFR)
const VTS = 30000, VDUR = VTS / vmeta.fps; // 1000 per frame
let vo = 0; const vS = vmeta.samples.map((s) => { const d = vbin.subarray(vo, vo + s.size); vo += s.size; return { data: d, key: s.key }; });

// interleave by decode time (~0.5 s chunks are fine; we do per sample)
const items = [
  ...vS.map((s, i) => ({ t: (i * VDUR) / VTS, track: "v", s })),
  ...(() => { let t = 0; return aS.map((s) => { const it = { t: t / aTs, track: "a", s }; t += s.dur; return it; }); })(),
].sort((a, b) => a.t - b.t || (a.track === "v" ? -1 : 1));

const ftyp = box("ftyp", Buffer.from("isom"), u32(512), Buffer.from("isomiso2avc1mp41"));
let mdatLen = 0; for (const it of items) { it.s.rel = mdatLen; mdatLen += it.s.data.length; }
const mdatHeader = Buffer.concat([u32(8 + mdatLen), Buffer.from("mdat")]);
const base = ftyp.length + 8;

// ---------- video trak ----------
const vMediaDur = vS.length * VDUR, vMovieDur = Math.round((vMediaDur / VTS) * MOVIE_TS);
const avcC = Buffer.from(vmeta.description, "base64");
// Signal High profile Level 4.0 (Apple max). The stream fits 4.0: 6720 MBs/frame (max 8192), 201,600 MB/s (max 245,760), ~5 Mbps (max 25).
const LEVEL = 0x28;
let spsPatched = 0;
{ const nSps = avcC[5] & 0x1f; let p = 6; for (let i = 0; i < nSps; i++) { const len = avcC.readUInt16BE(p); avcC[p + 2 + 3] = LEVEL; p += 2 + len; spsPatched++; } avcC[3] = LEVEL; }
for (const s of vS) { let p = 0; while (p + 4 < s.data.length) { const len = s.data.readUInt32BE(p); if ((s.data[p + 4] & 0x1f) === 7) { s.data[p + 4 + 3] = LEVEL; spsPatched++; } p += 4 + len; } }
console.log("level -> 4.0, SPS patched:", spsPatched, "avcC level", avcC[3], "profile", avcC[1]);
const compressor = Buffer.alloc(32); const cname = "Passage Walk H.264"; compressor[0] = cname.length; compressor.write(cname, 1, "latin1");
const avc1 = box("avc1", zeros(6), u16(1), u16(0, 0), u32(0, 0, 0), u16(vmeta.width, vmeta.height), u32(0x480000, 0x480000), u32(0), u16(1), compressor, u16(0x18), u16(0xffff),
  box("avcC", avcC), box("pasp", u32(1, 1)));
const keys = vS.map((s, i) => (s.key ? i + 1 : 0)).filter(Boolean);
const vstbl = box("stbl",
  full("stsd", 0, 0, u32(1), avc1),
  full("stts", 0, 0, u32(1), u32(vS.length, VDUR)),
  full("stss", 0, 0, u32(keys.length), u32(...keys)),
  full("stsc", 0, 0, u32(1, 1, 1, 1)),
  full("stsz", 0, 0, u32(0, vS.length), u32(...vS.map((s) => s.data.length))),
  full("stco", 0, 0, u32(vS.length), u32(...vS.map((s) => base + s.rel))));
const dinf = box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1)));
const vtrak = box("trak",
  full("tkhd", 0, 3, u32(0, 0, 1, 0, vMovieDur), zeros(8), u16(0, 0, 0, 0), MATRIX, u32(vmeta.width << 16, vmeta.height << 16)),
  box("mdia",
    full("mdhd", 0, 0, u32(0, 0, VTS, vMediaDur), u16(0x55c4, 0)),
    full("hdlr", 0, 0, u32(0), Buffer.from("vide"), zeros(12), Buffer.from("VideoHandler\0")),
    box("minf", full("vmhd", 0, 1, zeros(8)), dinf, vstbl)));

// ---------- audio trak (stsd copied from source) ----------
const aMediaDur = aS.reduce((a, s) => a + s.dur, 0), aMovieDur = Math.round((aMediaDur / aTs) * MOVIE_TS);
const astts = []; for (const s of aS) { const l = astts.at(-1); if (l && l[1] === s.dur) l[0]++; else astts.push([1, s.dur]); }
const astsd = find(atrak.children, "mdia", "minf", "stbl", "stsd");
const astbl = box("stbl",
  abuf.subarray(astsd.start, astsd.end),
  full("stts", 0, 0, u32(astts.length), ...astts.map(([c, d]) => u32(c, d))),
  full("stsc", 0, 0, u32(1, 1, 1, 1)),
  full("stsz", 0, 0, u32(0, aS.length), u32(...aS.map((s) => s.data.length))),
  full("stco", 0, 0, u32(aS.length), u32(...aS.map((s) => base + s.rel))));
const atrakOut = box("trak",
  full("tkhd", 0, 3, u32(0, 0, 2, 0, aMovieDur), zeros(8), u16(0, 1, 0x0100, 0), MATRIX, u32(0, 0)),
  box("mdia",
    full("mdhd", 0, 0, u32(0, 0, aTs, aMediaDur), u16(0x55c4, 0)),
    full("hdlr", 0, 0, u32(0), Buffer.from("soun"), zeros(12), Buffer.from("SoundHandler\0")),
    box("minf", full("smhd", 0, 0, zeros(4)), dinf, astbl)));

const movieDur = Math.max(vMovieDur, aMovieDur);
const mvhd = full("mvhd", 0, 0, u32(0, 0, MOVIE_TS, movieDur), u32(0x10000), u16(0x0100, 0), zeros(8), MATRIX, zeros(24), u32(3));
writeFileSync(OUT, Buffer.concat([ftyp, mdatHeader, ...items.map((it) => it.s.data), box("moov", mvhd, vtrak, atrakOut)]));
const avgMbps = (vS.reduce((a, s) => a + s.data.length, 0) * 8) / (vMediaDur / VTS) / 1e6;
console.log(`video ${vS.length} frames @ ${vmeta.fps} fps CFR, ${(vMediaDur / VTS).toFixed(3)} s, ${keys.length} keyframes, avg ${avgMbps.toFixed(1)} Mbps`);
console.log(`audio ${aS.length} AAC frames, ${(aMediaDur / aTs).toFixed(3)} s @ ${aTs} Hz`);
console.log("wrote", OUT, (movieDur / 1000).toFixed(3), "s");
