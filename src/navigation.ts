import { body, reducedMotion } from "./core";

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
  let activeFrame = 0;
  let navigationTarget: string | null = null;
  let navigationTimer = 0;

  const setActiveSection = (sectionId: string): void => {
    navLinks.forEach((link) => {
      const active = link.dataset.section === sectionId;
      link.classList.toggle("active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveSection = (): void => {
    activeFrame = 0;
    if (navigationTarget) {
      setActiveSection(navigationTarget);
      return;
    }

    const headerHeight = header?.offsetHeight ?? 0;
    const focusLine =
      headerHeight + (window.innerHeight - headerHeight) * 0.34;
    const current =
      sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= focusLine && bounds.bottom > focusLine;
      }) ??
      sections.reduce((closest, section) => {
        const distance = Math.abs(
          section.getBoundingClientRect().top - focusLine,
        );
        return distance < closest.distance
          ? { distance, section }
          : closest;
      }, { distance: Number.POSITIVE_INFINITY, section: sections[0] }).section;

    if (current) setActiveSection(current.id);
  };

  const scheduleActiveSection = (): void => {
    if (activeFrame) return;
    activeFrame = window.requestAnimationFrame(updateActiveSection);
  };

  const releaseNavigationTarget = (): void => {
    if (!navigationTarget) return;
    navigationTarget = null;
    window.clearTimeout(navigationTimer);
    scheduleActiveSection();
  };

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
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const sectionId = link.dataset.section;
      const target = sectionId
        ? document.getElementById(sectionId)
        : null;
      if (!sectionId || !target) return;

      navigationTarget = sectionId;
      setActiveSection(sectionId);
      setMenu(false);
      header?.classList.remove("hidden");

      window.clearTimeout(navigationTimer);
      navigationTimer = window.setTimeout(
        releaseNavigationTarget,
        reducedMotion.matches ? 0 : 3000,
      );
    });
  });
  window.addEventListener(
    "scroll",
    () => {
      const currentScroll = window.scrollY;
      const movingDown = currentScroll > previousScroll && currentScroll > 180;
      header?.classList.toggle(
        "hidden",
        movingDown &&
          !navigationTarget &&
          !body.classList.contains("menu-open"),
      );
      previousScroll = currentScroll;
      scheduleActiveSection();
    },
    { passive: true },
  );
  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "touch" && event.clientY <= 36) {
        header?.classList.remove("hidden");
      }
    },
    { passive: true },
  );
  header?.addEventListener("focusin", () => {
    header.classList.remove("hidden");
  });
  window.addEventListener("resize", scheduleActiveSection, { passive: true });
  window.addEventListener("scrollend", releaseNavigationTarget, {
    passive: true,
  });
  window.addEventListener("wheel", releaseNavigationTarget, { passive: true });
  window.addEventListener("touchstart", releaseNavigationTarget, {
    passive: true,
  });
  window.addEventListener("popstate", scheduleActiveSection);
  updateActiveSection();
};
