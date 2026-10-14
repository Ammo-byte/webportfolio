import { body, getFocusable, mobileLayout, reducedMotion } from "./core";

export const scrollSectionIntoView = (
  target: HTMLElement,
  behavior: ScrollBehavior,
): void => {
  const headerHeight =
    document.querySelector<HTMLElement>("#site-header")?.offsetHeight ?? 0;
  const top = target.id === "home"
    ? 0
    : window.scrollY + target.getBoundingClientRect().top - headerHeight - 28;
  window.scrollTo({ top: Math.max(0, top), behavior });
};

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
  let activeFrame = 0;
  let navigationTarget: string | null = null;
  let navigationTimer = 0;
  let historyTimer = 0;
  let menuOpen = false;
  const backgroundRegions = Array.from(
    document.querySelectorAll<HTMLElement>("main, body > footer"),
  );
  const previousInert = new Map<HTMLElement, boolean>();

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
    if (!menu || !menuButton) return;
    open = open && mobileLayout.matches;
    const wasOpen = menuOpen;
    menuOpen = open;
    if (open && !wasOpen) {
      backgroundRegions.forEach((region) => {
        previousInert.set(region, region.inert);
        region.inert = true;
      });
    } else if (!open && wasOpen) {
      const returnTarget = mobileLayout.matches
        ? menuButton
        : header?.querySelector<HTMLElement>(".logo");
      returnTarget?.focus({ preventScroll: true });
      previousInert.forEach((inert, region) => {
        region.inert = inert;
      });
      previousInert.clear();
    }
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("open", open);
    menu.inert = !open;
    body.classList.toggle("menu-open", open);
    if (open && !wasOpen) {
      window.requestAnimationFrame(() => {
        if (!menuOpen) return;
        menu.querySelector<HTMLAnchorElement>("a[href]")?.focus({
          preventScroll: true,
        });
      });
    }
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", (event) => {
    if (
      !menuOpen || !menu || !menuButton ||
      body.matches(".modal-open, .arcade-open")
    ) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [menuButton, ...getFocusable(menu)]
      .filter((element) => element.tabIndex >= 0);
    const currentIndex = focusable.indexOf(
      document.activeElement as HTMLElement,
    );
    const nextIndex = currentIndex === -1
      ? (event.shiftKey ? focusable.length - 1 : 0)
      : (currentIndex + (event.shiftKey ? -1 : 1) + focusable.length) %
        focusable.length;
    event.preventDefault();
    focusable[nextIndex]?.focus({ preventScroll: true });
  });
  mobileLayout.addEventListener("change", () => {
    if (!mobileLayout.matches && menuOpen) setMenu(false);
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

      event.preventDefault();
      navigationTarget = sectionId;
      setActiveSection(sectionId);
      setMenu(false);
      header?.classList.remove("hidden");

      scrollSectionIntoView(
        target,
        reducedMotion.matches ? "auto" : "smooth",
      );

      // Delay pushState to prevent Safari from aborting the smooth scroll halfway
      window.clearTimeout(historyTimer);
      historyTimer = window.setTimeout(() => {
        window.history.pushState(null, "", `#${sectionId}`);
      }, 800);

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
