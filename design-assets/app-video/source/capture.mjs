// Full app walkthrough capture: drives the real app from the splash screen to Journey Complete and records
// every painted frame of the phone screen (CDP screencast, 744 × 1564 = 2x of the 372 × 782 screen).
// Everything runs in 1/F slow motion (CSS animations via the Animation domain, JS timers / rAF via an init
// script) so the screencast catches enough frames; the editor plays it back at F×.
// Output: <out>/frames/NNNNN.jpg, <out>/frames.json (timestamps), <out>/markers.json
import { launch, sleep, HELPERS, BASE } from "./cdp2.mjs";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";

const OUT = process.argv[2];
rmSync(`${OUT}/frames`, { recursive: true, force: true });
mkdirSync(`${OUT}/frames`, { recursive: true });

const F = +(process.env.F || 3), S = 2; // slow motion factor, capture scale
const b = await launch(9387);

// Home greeting reads the clock: pick a timezone where it is ~9 am now ("Good Morning").
const utcH = new Date().getUTCHours();
let off = 9 - utcH; if (off > 14) off -= 24; if (off < -12) off += 24;
await b.send("Emulation.setTimezoneOverride", { timezoneId: off === 0 ? "Etc/GMT" : `Etc/GMT${off > 0 ? "-" : "+"}${Math.abs(off)}` });
await b.send("Emulation.setDeviceMetricsOverride", { width: 372 * S, height: 782 * S, deviceScaleFactor: 1, mobile: true });

// Slow JS time down by F (timers, rAF, performance.now) and fit the phone screen to the viewport.
const INIT = `(() => {
  const F = ${F}, oT = setTimeout.bind(window), oI = setInterval.bind(window), oN = performance.now.bind(performance), oR = requestAnimationFrame.bind(window), t0 = oN();
  window.setTimeout = (f, ms = 0, ...a) => oT(f, ms * F, ...a);
  window.setInterval = (f, ms = 0, ...a) => oI(f, ms * F, ...a);
  performance.now = () => t0 + (oN() - t0) / F;
  window.requestAnimationFrame = (cb) => oR(() => cb(performance.now()));
  const st = document.createElement('style'); st.textContent = \`
    html, body { margin:0 !important; overflow:hidden !important; background:#f6f3ea !important; }
    .ios-device-frame { position:fixed !important; left:0 !important; top:0 !important; width:372px !important; height:782px !important;
      padding:0 !important; border:0 !important; border-radius:0 !important; background:none !important; margin:0 !important;
      transform:scale(${S}) !important; transform-origin:0 0 !important; }
    .ios-device-screen { border-radius:0 !important; }
    .ios-dynamic-island, .ios-button { display:none !important; }
    .ios-device-screen *, .ios-device-screen *::before, .ios-device-screen *::after { box-shadow:none !important; text-shadow:none !important; }
    .rec-touch { position:fixed; z-index:99999; width:88px; height:88px; margin:-44px 0 0 -44px; border-radius:50%; pointer-events:none;
      background:rgba(255,255,255,.55); border:4px solid rgba(79,112,41,.75); animation:rec-touch .55s cubic-bezier(.22,1,.36,1) forwards; }
    .rec-ring { position:fixed; z-index:99998; width:88px; height:88px; margin:-44px 0 0 -44px; border-radius:50%; pointer-events:none;
      border:3px solid rgba(243,201,111,.95); animation:rec-ring .7s ease-out forwards; }
    @keyframes rec-touch { 0% { transform:scale(.55); opacity:0 } 25% { transform:scale(.8); opacity:1 } 100% { transform:scale(1); opacity:0 } }
    @keyframes rec-ring { 0% { transform:scale(.6); opacity:.9 } 100% { transform:scale(2.1); opacity:0 } }\`;
  const put = () => { if (document.head) { document.head.appendChild(st); return true; } return false; };
  if (!put()) new MutationObserver((m, o) => { if (put()) o.disconnect(); }).observe(document, { childList: true, subtree: true });
})();`;
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: INIT });
await b.send("Animation.enable");
await b.send("Animation.setPlaybackRate", { playbackRate: 1 / F });

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
const zz = (ms) => sleep(ms * F); // wait in 1x time

await b.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 372 * S, maxHeight: 782 * S, everyNthFrame: 1 });
await b.send("Page.navigate", { url: BASE });
mark("start");
await sleep(400);
for (let k = 0; k < 50; k++) { try { if (await b.evaluate("!!document.querySelector('.ios-device-screen')")) break; } catch {} await sleep(100); }
await b.evaluate(HELPERS);
const rect = await b.evaluate("JSON.stringify(document.querySelector('.ios-device-screen').getBoundingClientRect())");
console.log("screen rect", rect);
mark("splash");

// ---------- helpers ----------
const tapEl = async (findJs, label) => {
  const r = await b.evaluate(`(() => { const el = ${findJs}; if (!el) return null; el.scrollIntoView({block:'nearest'}); const q = el.getBoundingClientRect(); return { x: q.x + q.width/2, y: q.y + q.height/2 }; })()`);
  if (!r) { console.log("TAP NOTFOUND", label); return false; }
  await b.evaluate(`(() => { for (const c of ['rec-touch','rec-ring']) { const d = document.createElement('div'); d.className = c; d.style.left='${r.x}px'; d.style.top='${r.y}px'; document.body.appendChild(d); setTimeout(() => d.remove(), 900); } })()`);
  await zz(140);
  for (const type of ["mousePressed", "mouseReleased"]) await b.send("Input.dispatchMouseEvent", { type, x: r.x, y: r.y, button: "left", clickCount: 1 });
  markers.push({ name: "tap", t: Date.now() / 1000 }); console.log("tap", label);
  return true;
};
const byLabel = (txt, exact) => `(() => { const els = __clickables(); const n = s => s.toLowerCase(); return els.find(e => ${exact ? "__label(e) === " + JSON.stringify(txt) : "n(__label(e)) === n(" + JSON.stringify(txt) + ")"}) || ${exact ? "null" : "els.find(e => n(__label(e)).includes(n(" + JSON.stringify(txt) + ")))"}; })()`;
const tap = (txt, exact = false) => tapEl(byLabel(txt, exact), txt);
const waitText = async (txt, max = 60) => { for (let k = 0; k < max; k++) { if ((await b.evaluate("__text()")).includes(txt)) return true; await sleep(150); } console.log("WAIT TIMEOUT", txt); return false; };
const SCROLLER = `[...document.querySelectorAll('.ios-device-screen *')].filter(e => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.getBoundingClientRect().height > 200).sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]`;
// eased scroll by dy screen px (1x css px of the phone) over ms
const scroll = async (dy, ms) => {
  const steps = Math.max(1, Math.round(ms / 33));
  const e = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  for (let i = 1; i <= steps; i++) {
    const d = (e(i / steps) - e((i - 1) / steps)) * dy;
    await b.evaluate(`(() => { const sc = ${SCROLLER}; sc && sc.scrollBy(0, ${d}); })()`);
    await zz(33);
  }
};
const scrollTop = () => b.evaluate(`(() => { const sc = ${SCROLLER}; return sc ? sc.scrollTop : -1; })()`);
const typeInto = async (findJs, text, perChar = 55) => {
  await tapEl(findJs, "field"); await zz(200);
  for (let i = 1; i <= text.length; i++) {
    await b.evaluate(`(() => { const el = ${findJs}; const p = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(el, ${JSON.stringify(text)}.slice(0, ${i})); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await zz(perChar);
  }
};
const input = (ph) => `document.querySelector('input[placeholder=${JSON.stringify(ph)}]')`;

// ---------- the walkthrough ----------
await zz(2500); // splash (app moves on by itself after 2.6 s)
await waitText("Walk With Purpose");
mark("onboarding"); await zz(4300); // page 1 + one carousel change
await tap("Next"); await zz(2600);
await tap("Next"); await zz(2600);
await tap("Get Started"); await zz(900);
mark("welcome"); await zz(1500);
await tap("Create Account"); await zz(800);
mark("signup"); await zz(300);
await typeInto(input("First name"), "Sarah", 60); await zz(150);
await typeInto(input("Last name"), "Johnson", 50); await zz(150);
await typeInto(input("you@example.com"), "sarah@email.com", 35); await zz(150);
await typeInto(input("Create a password"), "walkwithgod", 30); await zz(100);
await typeInto(input("Repeat your password"), "walkwithgod", 25); await zz(200);
await scroll(420, 900); await zz(200);
await tapEl(`document.querySelector('input[type=checkbox]')`, "terms"); await zz(400);
await tap("Create Account", true); await zz(600);
mark("ready"); await zz(2600);
await tap("Choose My Journey"); await zz(900);
mark("choose"); await zz(1500);
await tap("Choose a Designed Experience"); await zz(700);
await tap("Continue"); await zz(900);
mark("designed"); await zz(600);
await scroll(900, 2200); await zz(400);
await tap("Go back"); await zz(800);
mark("choose33");
await tap("33-Day Walk"); await zz(700);
await tap("Continue"); await zz(900);
mark("version"); await zz(1800);
await tap("Continue with KJV"); await zz(900);
mark("set"); await zz(2200);
await tap("Start My Journey"); await zz(1300);
mark("home"); await zz(1300);
await scroll(1250, 3200); await zz(500);
await scroll(-1250, 1600); await zz(400);
await tap("3", true); await zz(800);
mark("notifications"); await zz(1900);
await tap("Back to Home"); await zz(700);
await tap("Enter Steps"); await zz(900);
mark("steps"); await zz(400);
for (const d of ["5", "4", "3", "2"]) { await tap(d, true); await zz(330); }
await zz(500);
await tap("Generate My Passage");
mark("generating");
await waitText("Your Passage Is Ready", 400);
mark("passage"); await zz(2600);
await tap("Read Chapter"); await zz(1100);
mark("reading"); await zz(800);
const centerVerse = async (txt, ms) => {
  const dy = await b.evaluate(`(() => { const e = [...document.querySelectorAll('.scripture-chapter-verse')].find(e => e.innerText.includes(${JSON.stringify(txt)})); if (!e) return 0; const r = e.getBoundingClientRect(); return (r.top + r.height / 2 - innerHeight * 0.45) / ${S}; })()`);
  await scroll(dy, ms);
};
const verse = (txt) => `[...document.querySelectorAll('.scripture-chapter-verse')].find(e => e.innerText.includes(${JSON.stringify(txt)}))`;
await centerVerse("Keep therefore and do them", 1300); await zz(400);
await tapEl(verse("Keep therefore and do them"), "verse 6"); await zz(1100);
await centerVerse("Only take heed", 800); await zz(300);
await tapEl(verse("Only take heed"), "verse 9"); await zz(1100);
await tap("Write Reflection"); await zz(1100);
mark("reflection"); await zz(500);
await typeInto(`document.querySelector('textarea')`, "Every step today felt like He was walking right beside me.", 28);
await b.evaluate(`(() => { const a = ["Keep His words close and teach them to the people I love.", "Remember what He has done, and walk in His ways today."]; [...document.querySelectorAll('textarea')].slice(1).forEach((el, i) => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el, a[i] || a[0]); el.dispatchEvent(new Event('input', { bubbles: true })); }); })()`);
await zz(500);
await tap("Save Reflection"); await zz(900);
mark("celebration"); await zz(4600);
await tap("Continue"); await zz(1000);
mark("saved"); await zz(1600);
await tap("Back to Home"); await zz(900);
await tap("Journey", true); await zz(900);
mark("journey"); await zz(1600);
await scroll(520, 1600); await zz(900);
await tap("Journal", true); await zz(900);
mark("journal"); await zz(2000);
await tapEl(`document.querySelector('.journal-highlights-link')`, "highlights"); await zz(900);
mark("highlights"); await zz(2200);
await tapEl(`document.querySelector('.journal-back')`, "back to journal"); await zz(600);
await tap("Milestones", true); await zz(900);
mark("milestones"); await zz(1800);
await scroll(380, 1200); await zz(600);
await tap("Day 3 Resurrection Walk"); await zz(1000);
mark("badge"); await zz(1200);
await scroll(700, 1800); await zz(1400);
await tap("Back to milestones"); await zz(600);
await tap("You", true); await zz(900);
mark("you"); await zz(1300);
await tap("Settings"); await zz(900);
mark("settings"); await zz(1800);
await tap("Journey Complete"); await zz(600);
mark("complete"); await zz(4200);
await tap("See What You Accomplished"); await zz(1200);
mark("story"); await zz(1500);
await scroll(700, 2200); await zz(1500);
mark("end");
await b.send("Page.stopScreencast"); await zz(300);

writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames));
writeFileSync(`${OUT}/markers.json`, JSON.stringify({ F, S, markers }, null, 1));
console.log("frames", frames.length, "span", (frames.at(-1).t - frames[0].t).toFixed(1), "s", "errors", JSON.stringify(b.errors));
b.close(); process.exit(0);
