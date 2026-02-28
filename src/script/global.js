import { initScrollReveal } from "@/components/helpers/scrollReveal";

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initScrollReveal, { timeout: 1000 });
  } else {
    window.addEventListener("load", initScrollReveal);
  }
}
