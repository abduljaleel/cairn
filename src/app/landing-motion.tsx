"use client";

import { useEffect } from "react";

/**
 * Renders nothing. On mount it enables the landing page's scroll-driven
 * reveal: adds .motion-ready to the page root (which arms the CSS hidden
 * states) and an IntersectionObserver that stamps .is-in on each
 * [data-reveal] element as it enters the viewport.
 *
 * Fully gated: if the user prefers reduced motion (or JS never runs),
 * .motion-ready is never added and the page renders fully visible and static.
 */
export default function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const root = document.getElementById("cairn-landing");
    if (!root) return;

    const elements = Array.from(root.querySelectorAll("[data-reveal]"));
    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
