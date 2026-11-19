# App videos

| File | What | Specs |
|---|---|---|
| `passagewalk-app-walkthrough.mp4` | Full app walkthrough for the client (splash → onboarding → sign up → choose journey → Home → daily walk → Journey / Journal / Milestones → Settings → Journey Complete) | 2:00, 1080 × 1920 portrait, H.264 30 fps CFR, AAC 48 kHz stereo, ~6.6 Mbps, ~100 MB |
| `passagewalk-app-walkthrough-poster.jpg` | Still frame (Home) for a thumbnail | 1080 × 1920 |
| `passagewalk-app-preview.mp4` | Copy of the iOS App Store preview (original: `app-store/ios/app-preview/`) | 29 s, 886 × 1920 |

Walkthrough design: real app recording inside a flat phone frame (no shadows), caption card above the phone (eyebrow + serif line, progress bar), animated client-green background (light blobs, soft rays, two footprint trails walking up the sides, light motes), intro + end title with the app icon. Music is original (piano + pad, F major, soft "footstep" pulse and bells on badge moments, tap clicks) — no licence needed.

## Re-make (source/)
1. `npx vite preview --port 4173` (production build of the app).
2. `F=3 node capture.mjs <take dir>` — drives the app in 1/3 slow motion and saves screen frames + scene markers (~7 min).
3. `node make-video.mjs stills <take dir> 10 40 …` — check frames. Captions / speeds: `CAPTIONS` / `SPEED` in `editor.html`.
4. `node make-video.mjs cfr <take dir>` and `node make-video.mjs audio <take dir>` (audio ~6 min), then
   `node mux.mjs <take>/video-cfr.h264bin <take>/video-cfr.json <take>/audio-src.mp4 <out.mp4>`.
