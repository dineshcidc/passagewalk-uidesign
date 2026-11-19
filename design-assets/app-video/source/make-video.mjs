// node make-video.mjs <stills|cfr|audio> <take dir> [times...]
// Serves the take folder (frames + markers) with the editor and runs it in headless Chrome.
import { launch, sleep } from "./cdp2.mjs";
import { writeFileSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [, , mode, TAKE, ...rest] = process.argv;
copyFileSync(`${HERE}/editor.html`, `${TAKE}/editor.html`);
copyFileSync(`${HERE}/../../app-icon/android/play-store-512.png`, `${TAKE}/icon.png`);
const srv = spawn(process.execPath, [`${HERE}/serve.mjs`, TAKE, String(4191 + +(process.env.P || 0))], { stdio: "ignore" });
await sleep(700);

const b = await launch(9392 + +(process.env.P || 0));
await b.send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await b.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: path.resolve(TAKE), eventsEnabled: true });
await b.send("Page.navigate", { url: `http://localhost:${4191 + +(process.env.P || 0)}/editor.html` }); await sleep(2500);
let downloads = 0; b.on((m) => { if (m.method === "Browser.downloadProgress" && m.params.state === "completed") downloads++; });

if (mode === "stills") {
  const times = rest.length ? rest.map(Number) : [1, 2.4, 4, 10, 20, 40, 60, 80, 100, 115, 118];
  let info;
  for (const t of times) {
    info = await b.evaluate(`still(${t})`); await sleep(120);
    const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    writeFileSync(`${TAKE}/still-${String(t.toFixed(1)).padStart(5, "0")}.jpg`, Buffer.from(r.result.data, "base64"));
  }
  console.log(JSON.stringify(info));
} else if (mode === "cfr") {
  console.log(JSON.stringify(await b.evaluate(`encodeCFR(${rest[0] || 6500000})`)));
  for (let i = 0; i < 150 && downloads < 2; i++) await sleep(200);
  console.log("downloads", downloads);
} else if (mode === "eval") {
  console.log(JSON.stringify(await b.evaluate(rest.join(" "))));
} else if (mode === "audio") {
  console.log(JSON.stringify(await b.evaluate(`recordAudio()`)));
  for (let i = 0; i < 150 && downloads < 1; i++) await sleep(200);
  console.log("downloads", downloads);
}
console.log("errors", JSON.stringify(b.errors)); b.close(); srv.kill(); process.exit(0);
