import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MilestoneInfo } from "../data/milestones";
import CompletionCertificate from "./CompletionCertificate";

// Full-screen certificate (eye button): the landscape certificate turned sideways to fill the phone, like a photo
// viewer — the user turns the phone to read it. Rotate turns it 90° each tap (all 4 sides); Close (or Esc) returns.
export default function CertificateViewer({ day, completedOn, info, onClose }: { day: number; completedOn?: string; info: MilestoneInfo; onClose: () => void }) {
  // Total turn in degrees (keeps counting so the animation always turns the short way).
  const [angle, setAngle] = useState(90);
  const sideways = Math.abs(angle % 180) === 90;
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Scale the certificate to the largest size that fits the viewer in the current orientation.
  useLayoutEffect(() => {
    const fit = () => {
      // Layout sizes (not screen rects), so the fit is right even when the device frame itself is scaled.
      const stage = stageRef.current;
      const paper = paperRef.current;
      if (!stage || !paper) return;
      const width = paper.offsetWidth;
      const height = paper.offsetHeight;
      const [fitWidth, fitHeight] = sideways ? [height, width] : [width, height];
      setScale(Math.min((stage.clientWidth - 24) / fitWidth, (stage.clientHeight - 24) / fitHeight));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [sideways]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="certificate-viewer" role="dialog" aria-modal="true" aria-label="Certificate of Completion, full screen">
      <div className="certificate-viewer-bar">
        <div className="certificate-viewer-rotate">
          <button onClick={() => setAngle((value) => value + 90)} aria-label="Rotate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
          </button>
        </div>
        <strong>{info.shortName}</strong>
        <button className="certificate-viewer-close" onClick={onClose} aria-label="Close full screen certificate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="certificate-viewer-stage" ref={stageRef}>
        <div className="certificate-viewer-paper" ref={paperRef} style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})` }}>
          <CompletionCertificate day={day} completedOn={completedOn} info={info} />
        </div>
      </div>
      <p className="certificate-viewer-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>
        {sideways ? "Turn your phone sideways to read your certificate" : "Tap rotate to turn it to any side"}
      </p>
    </div>
  );
}
