import { reducedMotion } from "./core";

export const initReveals = (): void => {
  const reveals = Array.from(
    document.querySelectorAll<HTMLElement>(".reveal"),
  );
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(".section-observed"),
  );

  if (reducedMotion.matches) {
    reveals.forEach((element) => element.classList.add("visible"));
    sections.forEach((section) => section.classList.add("section-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.12 },
  );
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("section-visible");
      });
    },
    { rootMargin: "0px 0px -24%", threshold: 0.12 },
  );
  reveals.forEach((element) => revealObserver.observe(element));
  sections.forEach((section) => sectionObserver.observe(section));
};
