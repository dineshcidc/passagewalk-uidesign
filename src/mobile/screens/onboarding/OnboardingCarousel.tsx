import { useEffect, useState } from "react";

export type CarouselImage = { src: string; alt: string; position?: string };

// Client ask (2026-11-12): while the user stays on an onboarding page, its top banner keeps changing between
// 3 images — slow cross-fade + gentle zoom, next image picked at random (never the same one twice in a row).
// The first image is always the page's original (client) photo. Placeholder photos until the client's set arrives.
const HOLD_MS = 5200;

export default function OnboardingCarousel({ images }: { images: CarouselImage[] }) {
  // The image fading out keeps its zoom running, so it never snaps back mid-fade. The zoom animation name
  // alternates every turn (zoom-0 / zoom-1), so an image picked again right after leaving restarts its zoom.
  const [{ active, leaving, turn }, setSlides] = useState({ active: 0, leaving: null as number | null, turn: 0 });

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setSlides(({ active: current, turn: last }) => {
        let next = Math.floor(Math.random() * (images.length - 1));
        if (next >= current) next += 1;
        return { active: next, leaving: current, turn: last + 1 };
      });
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="onboarding-carousel">
      {images.map((image, index) => {
        const state = index === active ? `is-active zoom-${turn % 2}` : index === leaving ? `is-leaving zoom-${(turn + 1) % 2}` : "";
        return (
          <img
            key={image.src}
            className={state}
            src={image.src}
            alt={index === active ? image.alt : ""}
            aria-hidden={index !== active}
            style={image.position ? { objectPosition: image.position } : undefined}
          />
        );
      })}
    </div>
  );
}
