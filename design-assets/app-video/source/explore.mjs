// Walks the app once (no recording) and dumps text + clickable labels at each step, plus a screenshot.
import { launch, sleep, HELPERS, BASE } from "./cdp2.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await launch(9395);
await b.send("Page.navigate", { url: BASE }); await sleep(3500);
await b.evaluate(HELPERS);
let i = 0;
const dump = async (name) => {
  const t = await b.evaluate("__text()");
  const c = await b.evaluate("__clickables().map(__label).filter(Boolean).slice(0,60).join(' | ')");
  writeFileSync(`${OUT}/${String(i).padStart(2, "0")}-${name}.txt`, t + "\n\n--- CLICKABLES ---\n" + c);
  const r = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
  writeFileSync(`${OUT}/${String(i++).padStart(2, "0")}-${name}.jpg`, Buffer.from(r.result.data, "base64"));
};
const steps = JSON.parse(process.argv[3] || "[]");
await dump("start");
for (const s of steps) {
  let r;
  if (s.click) r = await b.evaluate(`__click(${JSON.stringify(s.click)}, ${s.exact ? "true" : "false"})`);
  if (s.type) r = await b.evaluate(`__type(${JSON.stringify(s.type[0])}, ${JSON.stringify(s.type[1])})`);
  if (s.js) r = await b.evaluate(s.js);
  console.log(JSON.stringify(s), "->", r);
  await sleep(s.wait || 900);
  if (s.dump) await dump(s.dump);
}
console.log("errors", JSON.stringify(b.errors)); b.close(); process.exit(0);
