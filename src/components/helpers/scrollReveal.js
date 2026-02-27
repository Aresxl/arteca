export function initScrollReveal() {
  if (typeof window === "undefined") return;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // animate once
        }
      }
    },
    {
      //   threshold: 0.15,
      threshold: window.innerWidth < 600 ? 0.25 : 0.2,
    },
  );

  const fadeInEls = document.querySelectorAll(`.fade-in`);
  fadeInEls.forEach((el) => observer.observe(el));
}
