// Drives the real app and records every painted frame (CDP screencast) at 886 × 1920, with tap ripples.
// Output: <out>/frames/NNNNN.jpg + <out>/frames.json (wall-clock timestamps) + <out>/markers.json
import { launch, sleep, HELPERS, BASE } from "./cdp2.mjs";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";

const OUT = process.argv[2];
rmSync(`${OUT}/frames`, { recursive: true, force: true });
mkdirSync(`${OUT}/frames`, { recursive: true });

const b = await launch(9381);
// greeting reads the clock: pick a timezone where it is ~9 am now, so Home says "Good Morning"
const utcH = new Date().getUTCHours();
let off = 9 - utcH; if (off > 14) off -= 24; if (off < -12) off += 24;
await b.send("Emulation.setTimezoneOverride", { timezoneId: off === 0 ? "Etc/GMT" : `Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off)}` });
await b.send("Emulation.setDeviceMetricsOverride", { width: 886, height: 1920, deviceScaleFactor: 1, mobile: true });
await b.send("Page.navigate", { url: BASE }); await sleep(3600);
await b.evaluate(HELPERS);

// full-bleed phone screen (as an iPhone screen recording): no bezel, no dynamic island
const FIT = `(() => { const st = document.createElement('style'); st.id='rec-fit'; st.textContent = \`
  html, body { margin:0 !important; overflow:hidden !important; background:#f6f3ea !important; }
  .ios-device-frame { position:fixed !important; left:-13.7px !important; top:0 !important; width:372px !important; height:782px !important;
    padding:0 !important; border:0 !important; border-radius:0 !important; background:none !important; margin:0 !important;
    transform:scale(2.45524) !important; transform-origin:0 0 !important; }
  .ios-device-screen { border-radius:0 !important; }
  .ios-dynamic-island, .ios-button { display:none !important; }
  .ios-device-screen *, .ios-device-screen *::before, .ios-device-screen *::after { box-shadow:none !important; text-shadow:none !important; }
  .rec-touch { position:fixed; z-index:99999; width:112px; height:112px; margin:-56px 0 0 -56px; border-radius:50%; pointer-events:none;
    background:rgba(255,255,255,.55); border:5px solid rgba(79,112,41,.75); animation:rec-touch .55s cubic-bezier(.22,1,.36,1) forwards; }
  .rec-ring { position:fixed; z-index:99998; width:112px; height:112px; margin:-56px 0 0 -56px; border-radius:50%; pointer-events:none;
    border:4px solid rgba(243,201,111,.95); animation:rec-ring .7s ease-out forwards; }
  @keyframes rec-touch { 0% { transform:scale(.55); opacity:0 } 25% { transform:scale(.8); opacity:1 } 100% { transform:scale(1); opacity:0 } }
  @keyframes rec-ring { 0% { transform:scale(.6); opacity:.9 } 100% { transform:scale(2.1); opacity:0 } }
\`; document.head.appendChild(st); return 1; })()`;
await b.evaluate(FIT);

const frames = [], markers = [];
let n = 0;
b.on(async (msg) => {
  if (msg.method !== "Page.screencastFrame") return;
  const { data, metadata, sessionId } = msg.params;
  const file = String(n++).padStart(5, "0") + ".jpg";
  writeFileSync(`${OUT}/frames/${file}`, Buffer.from(data, "base64"));
  frames.push({ f: file, t: metadata.timestamp });
  b.send("Page.screencastFrameAck", { sessionId });
});
const mark = (name) => { markers.push({ name, t: Date.now() / 1000 }); console.log("mark", name); };

// tap at an element's centre with a visible touch indicator
const F = 4; // record in 1/F slow motion, speed back up in the edit
const zz = (ms) => sleep(ms * F);
const tapEl = async (findJs, label) => {
  const r = await b.evaluate(`(() => { const el = ${findJs}; if (!el) return null; el.scrollIntoView({block:'nearest'}); const q = el.getBoundingClientRect(); return { x: q.x + q.width/2, y: q.y + q.height/2 }; })()`);
  if (!r) { console.log("TAP NOTFOUND", label); return false; }
  await b.evaluate(`(() => { for (const c of ['rec-touch','rec-ring']) { const d = document.createElement('div'); d.className = c; d.style.left='${r.x}px'; d.style.top='${r.y}px'; document.body.appendChild(d); setTimeout(() => d.remove(), 900 * ${F}); } })()`);
  await zz(140);
  for (const type of ["mousePressed", "mouseReleased"]) await b.send("Input.dispatchMouseEvent", { type, x: r.x, y: r.y, button: "left", clickCount: 1 });
  console.log("tap", label);
  return true;
};
const byLabel = (txt, exact) => `(() => { const els = __clickables(); const n = s => s.toLowerCase(); return els.find(e => ${exact ? "__label(e) === " + JSON.stringify(txt) : "n(__label(e)) === n(" + JSON.stringify(txt) + ")"}) || els.find(e => n(__label(e)).includes(n(${JSON.stringify(txt)}))); })()`;
const tap = (txt, exact = false) => tapEl(byLabel(txt, exact), txt);
const quick = async (txt, exact = false) => { await b.evaluate(`__click(${JSON.stringify(txt)}, ${exact})`); await sleep(900); };

// --- setup (not recorded) ---
await quick("Next"); await quick("Next"); await quick("Get Started"); await quick("Create Account");
await b.evaluate(`__type("input","Sarah")`); await sleep(200);
await quick("Create Account", true); await sleep(600);
await quick("Choose My Journey"); await quick("33-Day Walk"); await quick("Continue"); await quick("Continue with KJV");
await quick("Start My Journey"); await sleep(2200);
await b.evaluate(FIT.replace("st.id='rec-fit'", "st.id='rec-fit2'"));

// --- recorded take ---
await b.send("Animation.enable"); await b.send("Animation.setPlaybackRate", { playbackRate: 1 / F });
const scrollSteps = async (dy, ms) => { const steps = Math.round(ms / 33); for (let i = 1; i <= steps; i++) { const e = (t) => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; const d = (e(i/steps) - e((i-1)/steps)) * dy / 2.45524; await b.evaluate(`(() => { const sc = [...document.querySelectorAll('.ios-device-screen *')].find(e => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); sc && sc.scrollBy(0, ${d}); })()`); await zz(33); } };

await b.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 886, maxHeight: 1920, everyNthFrame: 1 });
await zz(700);
mark("home"); await zz(2300);
await tap("Enter Steps"); await zz(1100);
mark("steps"); await zz(500);
for (const d of ["5", "4", "3", "2"]) { await tap(d, true); await zz(380); }
await zz(700);
await tap("Generate My Passage");
mark("generating"); await zz(400);
// wait for the passage
for (let k = 0; k < 40; k++) { if ((await b.evaluate("__text()")).includes("Your Passage Is Ready")) break; await sleep(150); }
mark("passage"); await zz(2600);
await tap("Read Chapter"); await zz(1500);
mark("reading"); await zz(700);
const centerVerse = async (txt, ms) => { const dy = await b.evaluate(`(() => { const e = [...document.querySelectorAll('.scripture-chapter-verse')].find(e => e.innerText.includes(${JSON.stringify(txt)})).getBoundingClientRect(); return e.top + e.height / 2 - innerHeight * 0.45; })()`); await scrollSteps(dy, ms); };
await centerVerse("Keep therefore and do them", 1100); await zz(500);
await tapEl(`[...document.querySelectorAll('.scripture-chapter-verse')].find(e => e.innerText.includes('Keep therefore and do them'))`, "verse 6"); await zz(1200);
await centerVerse("Only take heed", 800); await zz(400);
await tapEl(`[...document.querySelectorAll('.scripture-chapter-verse')].find(e => e.innerText.includes('Only take heed'))`, "verse 9"); await zz(1300);
await tap("Write Reflection"); await zz(1400);
mark("reflection"); await zz(600);
// type the first answer like a person
await tapEl(`document.querySelector('textarea')`, "answer 1"); await zz(300);
const answer = "Every step today felt like He was walking right beside me.";
for (let i = 1; i <= answer.length; i += 2) {
  await b.evaluate(`(() => { const el = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el, ${JSON.stringify(answer)}.slice(0, ${i})); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await zz(45);
}
await b.evaluate(`(() => { const a = ["Keep His words close and teach them to the people I love.", "Remember what He has done, and walk in His ways today."]; [...document.querySelectorAll('textarea')].slice(1).forEach((el, i) => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el, a[i] || a[0]); el.dispatchEvent(new Event('input', { bubbles: true })); }); })()`);
await zz(700);
await tap("Save Reflection");
await zz(1200);
mark("celebration"); await zz(5200);
await tap("Continue"); await zz(1500);
mark("saved"); await zz(1600);
await tap("Back to Home"); await zz(1500);
await tap("Journey", true); await zz(1200);
mark("journey"); await zz(2500);
await tap("Milestones", true); await zz(1200);
mark("milestones"); await zz(3000);
mark("end");
await b.send("Page.stopScreencast"); await zz(500);

writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames));
writeFileSync(`${OUT}/markers.json`, JSON.stringify({ F, markers }, null, 1));
console.log("frames", frames.length, "span", (frames.at(-1).t - frames[0].t).toFixed(1), "s", "errors", JSON.stringify(b.errors));
b.close(); process.exit(0);
