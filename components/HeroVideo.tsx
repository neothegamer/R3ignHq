"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muted looping background video for the home hero.
 * Desktop only (>= 1024px) and skipped for prefers-reduced-motion.
 * The <video> element is not rendered at all otherwise, so phones and
 * tablets never download the file.
 */
export default function HeroVideo() {
  const [show, setShow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setShow(desktop.matches && !reduce.matches);
    update();
    desktop.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (show && video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        src="/videos/hero-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(10,12,11,0.9) 0%, rgba(10,12,11,0.65) 50%, rgba(10,12,11,0.35) 100%), linear-gradient(180deg, rgba(10,12,11,0.35) 0%, rgba(10,12,11,0) 30%, rgba(10,12,11,0.6) 100%)",
        }}
      />
    </div>
  );
}
