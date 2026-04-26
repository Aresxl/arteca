import { initScrollReveal } from "@/components/helpers/scrollReveal";

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initScrollReveal, { timeout: 1000 });
  } else {
    window.addEventListener("load", initScrollReveal);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-track='cta']");
    if (!btn) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cta_click",
      cta_text: btn.textContent.trim(),
      cta_destination: btn.href || "form_submit",
    });
  });
}
