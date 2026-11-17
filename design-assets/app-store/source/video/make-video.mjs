import { launch, sleep } from "./cdp2.mjs";
import { writeFileSync } from "node:fs";
const [, , mode, OUT] = process.argv;
const b = await launch(9391);
await b.send("Emulation.setDeviceMetricsOverride", { width: 886, height: 1920, deviceScaleFactor: 1, mobile: false });
await b.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: OUT.replace(/\//g, "\\"), eventsEnabled: true });
await b.send("Page.navigate", { url: "http://localhost:4190/editor.html" }); await sleep(2500);
if (mode === "stills") {
  for (const s of [0.8, 2.5, 5.5, 7.0, 8.5, 11, 14, 17, 20.5, 23, 26.5, 27.6, 29.2]) {
    await b.evaluate(`still(${s})`); await sleep(150);
    const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    writeFileSync(`${OUT}/still-${String(s).replace(".", "_")}.jpg`, Buffer.from(r.result.data, "base64"));
  }
  console.log("total", await b.evaluate(`still(0)`));
} else if (mode === "cfr") {
  let n = 0; b.on((m) => { if (m.method === "Browser.downloadProgress" && m.params.state === "completed") n++; });
  console.log(JSON.stringify(await b.evaluate(`encodeCFR()`)));
  for (let i = 0; i < 100 && n < 2; i++) await sleep(200);
  console.log("downloads", n);
} else {
  let done = false; b.on((m) => { if (m.method === "Browser.downloadProgress" && m.params.state === "completed") done = true; });
  console.log(JSON.stringify(await b.evaluate(`render()`)));
  for (let i = 0; i < 100 && !done; i++) await sleep(200);
  console.log("downloaded", done);
}
console.log("errors", JSON.stringify(b.errors)); b.close(); process.exit(0);
