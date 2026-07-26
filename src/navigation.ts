import { body } from "./core";

export const initNavigation = (): void => {
  const header = document.querySelector<HTMLElement>("#site-header");
  const menuButton = document.querySelector<HTMLButtonElement>("#menu-toggle");
  const menu = document.querySelector<HTMLElement>("#mobile-menu");
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".nav-link"),
  );
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(
      "main > section[id], #experience",
    ),
  );
  let previousScroll = window.scrollY;

  const setMenu = (open: boolean): void => {
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu?.setAttribute("aria-hidden", String(!open));
    menu?.classList.toggle("open", open);
    if (menu) menu.inert = !open;
    body.classList.toggle("menu-open", open);
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  window.addEventListener(
    "scroll",
    () => {
      const currentScroll = window.scrollY;
      const movingDown = currentScroll > previousScroll && currentScroll > 180;
      header?.classList.toggle(
        "hidden",
        movingDown && !body.classList.contains("menu-open"),
      );
      previousScroll = currentScroll;
    },
    { passive: true },
  );

  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => {
        link.classList.toggle(
          "active",
          link.dataset.section === current.target.id,
        );
      });
    },
    { rootMargin: "-30% 0px -55%", threshold: [0.1, 0.35, 0.7] },
  );
  sections.forEach((section) => observer.observe(section));
};
