// Minimal headless-Chrome driver over CDP (no deps).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const BASE = process.env.BASE || "http://localhost:4173/";

export async function launch(port = 9333) {
  const dir = mkdtempSync(path.join(tmpdir(), "pwqa-"));
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--autoplay-policy=no-user-gesture-required", "--window-size=430,932", "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 150; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {}
    await sleep(200);
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map(); const errors = []; const listeners = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method) for (const l of listeners) l(msg);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === "Runtime.exceptionThrown") errors.push("EXC " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) errors.push(msg.params.type + " " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") errors.push("LOG " + msg.params.entry.text + " " + (msg.params.entry.url || ""));
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result?.result?.value;
  };
  return { send, evaluate, errors, on: (fn) => listeners.push(fn), close: () => { try { ws.close(); } catch {} proc.kill(); } };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In-page helpers injected once per load
export const HELPERS = `
window.__vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
window.__clickables = () => [...document.querySelectorAll('button, a, [role=button], [role=tab], label, input[type=checkbox], input[type=radio], [onclick]')].filter(__vis);
window.__label = (el) => (el.innerText || el.getAttribute('aria-label') || el.value || '').replace(/\\s+/g,' ').trim();
window.__click = (txt, exact) => {
  const els = exact === "last" ? __clickables().reverse() : __clickables();
  const norm = (s) => s.toLowerCase();
  let el = els.find((e) => exact === true ? __label(e) === txt : norm(__label(e)) === norm(txt));
  if (!el) el = els.find((e) => norm(__label(e)).includes(norm(txt)));
  if (!el) el = els.find((e) => norm(e.getAttribute('aria-label')||'').includes(norm(txt)));
  if (!el) return 'NOTFOUND';
  if (el.disabled) return 'DISABLED:' + __label(el);
  el.scrollIntoView({block:'center'}); el.click(); return 'OK:' + __label(el).slice(0,60);
};
window.__text = () => document.body.innerText.replace(/\\n{2,}/g,'\\n');
window.__audit = () => {
  const t = document.body.innerText; const issues = [];
  for (const re of [/\\bundefined\\b/, /\\bNaN\\b/, /\\bnull\\b/, /\\[object Object\\]/, /\\b1 (days|chapters|verses|steps|books|badges|reflections|highlights)\\b/, /\\b(\\w+) \\1\\b/i, /Infinity/]) { const m = t.match(re); if (m) issues.push('text:' + m[0]); }
  const w = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > w + 1) issues.push('page-hscroll ' + document.documentElement.scrollWidth);
  return issues;
};
window.__type = (sel, val) => { const el = document.querySelector(sel); if (!el) return 'NOTFOUND'; const proto = el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,val); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return 'OK'; };
`;
