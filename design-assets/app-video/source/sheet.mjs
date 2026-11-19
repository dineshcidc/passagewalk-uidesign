// Contact sheet of JPGs in a folder (for checking): node sheet.mjs <dir> <out.jpg> [cols] [width]
import { launch, sleep } from "./cdp2.mjs";
import { readdirSync, writeFileSync } from "node:fs";
const [, , DIR, OUT, COLS = "8", WIDTH = "1600"] = process.argv;
const files = readdirSync(DIR).filter((f) => f.endsWith(".jpg")).sort();
const cols = +COLS, w = +WIDTH, cw = Math.floor(w / cols);
const html = `<html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${cw}px);font:11px sans-serif;color:#eee">${files.map((f) => `<div><img src="file:///${DIR.replace(/\\/g, "/")}/${f}" style="width:${cw - 4}px;display:block"><div>${f}</div></div>`).join("")}</body></html>`;
const p = `${DIR}/_sheet.html`; writeFileSync(p, html);
const b = await launch(9399);
const rows = Math.ceil(files.length / cols);
await b.send("Emulation.setDeviceMetricsOverride", { width: w, height: 100, deviceScaleFactor: 1, mobile: false });
await b.send("Page.navigate", { url: "file:///" + p.replace(/\\/g, "/") }); await sleep(1500);
const h = await b.evaluate("document.body.scrollHeight");
await b.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(400);
const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
writeFileSync(OUT, Buffer.from(r.result.data, "base64")); console.log("rows", rows, "h", h); b.close(); process.exit(0);
