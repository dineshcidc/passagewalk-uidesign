// node render.mjs <pdf> <outPrefix> [scale] [pages per row for sheets]  → <outPrefix>-sheet-N.jpg (6 pages each)
import http from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { launch, sleep } = await import(pathToFileURL("C:/Users/DineshKumarJayapraka/OneDrive - CONCERT IDC LLC/Desktop/Cidc-Projects/passagewalk-uidesign/design-assets/app-video/source/cdp2.mjs").href);
const [, , PDF, OUT, SCALE = "1", PER = "6"] = process.argv;
const types = { ".html": "text/html", ".mjs": "text/javascript", ".pdf": "application/pdf" };
const html = `<html><body style="margin:0;background:#888;display:flex;flex-wrap:wrap;gap:10px;padding:10px;width:max-content">
<script type="module">
import * as pdfjs from "/node_modules/pdfjs-dist/build/pdf.mjs";
pdfjs.GlobalWorkerOptions.workerSrc = "/node_modules/pdfjs-dist/build/pdf.worker.mjs";
window.render = async (from, to, scale) => {
  document.querySelectorAll("canvas").forEach(c => c.remove());
  const doc = await pdfjs.getDocument("/doc.pdf").promise;
  to = Math.min(to, doc.numPages);
  for (let i = from; i <= to; i++) {
    const pg = await doc.getPage(i); const vp = pg.getViewport({ scale });
    const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; document.body.appendChild(c);
    await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
  }
  return { n: doc.numPages, w: document.body.scrollWidth, h: document.body.scrollHeight };
};
window.ready = true;
</script></body></html>`;
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(html); }
  const p = u === "/doc.pdf" ? PDF : path.join(HERE, u);
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(readFileSync(p));
}).listen(4301);
const b = await launch(9411);
await b.send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
await b.send("Page.navigate", { url: "http://localhost:4301/" }); await sleep(1500);
const per = +PER; let n = 999;
for (let s = 1, k = 1; s <= n; s += per, k++) {
  const info = await b.evaluate(`render(${s}, ${s + per - 1}, ${SCALE})`); n = info.n;
  await b.send("Emulation.setDeviceMetricsOverride", { width: info.w, height: info.h, deviceScaleFactor: 1, mobile: false }); await sleep(300);
  const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
  writeFileSync(`${OUT}-${k}.jpg`, Buffer.from(r.result.data, "base64"));
}
console.log("pages", n, "errors", JSON.stringify(b.errors)); b.close(); srv.close(); process.exit(0);
