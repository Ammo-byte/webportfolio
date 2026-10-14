import { reducedMotion } from "./core";

export const initReveals = (): void => {
  const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".section-observed"));

  const showAll = (): void => {
    document.body.classList.remove("motion-ready");
    reveals.forEach((element) => element.classList.add("visible"));
    sections.forEach((section) => section.classList.add("section-visible"));
  };
  if (reducedMotion.matches) {
    showAll();
    return;
  }

  document.body.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    const arriving = entries.filter((entry) => entry.isIntersecting);
    arriving.forEach((entry, index) => {
      const element = entry.target as HTMLElement;
      if (!element.closest("#home")) {
        element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 210)}ms`);
      }
      element.classList.add("visible");
      observer.unobserve(element);
    });
  }, { rootMargin: "0px 0px -4%", threshold: .08 });
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("section-visible");
    });
  }, { threshold: .1 });
  reveals.forEach((element) => revealObserver.observe(element));
  sections.forEach((section) => sectionObserver.observe(section));
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    revealObserver.disconnect();
    sectionObserver.disconnect();
    showAll();
  });
};
