export function initScrollReveal() {
  if (typeof window === "undefined") return;

  // One-shot reveal: add `.is-visible` the first time a target crosses the
  // trigger line, then stop watching it so the list drains as the user scrolls.
  const reveal = (entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  };

  // Section fades trigger just before fully in view. On mobile, sections stack
  // tall (often taller than the viewport), so an area-fraction threshold would
  // make the user scroll most of a screen before it fires. There we fire off the
  // top edge crossing a line near the bottom of the viewport instead — that's
  // height-independent, so tall and short sections reveal at the same moment.
  const isMobile = window.innerWidth < 600;
  const fadeObserver = new IntersectionObserver(reveal, {
    threshold: isMobile ? 0 : 0.2,
    rootMargin: isMobile ? "0px 0px -12% 0px" : "0px 0px -10% 0px",
  });
  document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));

  // Italic underlines draw later — the title has to sit well inside the
  // viewport (~25% up from the bottom edge) before the line draws.
  const italicObserver = new IntersectionObserver(reveal, {
    threshold: 0.6,
    rootMargin: "0px 0px -25% 0px",
  });
  document.querySelectorAll(".italic-text").forEach((el) => italicObserver.observe(el));
}
