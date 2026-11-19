import http from "node:http"; import { readFile } from "node:fs/promises"; import path from "node:path";
const root = process.argv[2], port = +process.argv[3];
const types = { ".html": "text/html", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4" };
http.createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(req.url.split("?")[0])); const body = await readFile(p);
    const h = { "content-type": types[path.extname(p)] || "application/octet-stream", "accept-ranges": "bytes" };
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
    if (m) { const s = m[1] ? +m[1] : body.length - +m[2], e = m[1] && m[2] ? +m[2] : body.length - 1; res.writeHead(206, { ...h, "content-range": `bytes ${s}-${e}/${body.length}`, "content-length": e - s + 1 }); res.end(body.subarray(s, e + 1)); }
    else { res.writeHead(200, { ...h, "content-length": body.length }); res.end(body); }
  } catch { res.writeHead(404); res.end(); }
}).listen(port, () => console.log("serving", root, port));
