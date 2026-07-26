import { mobileLayout, reducedMotion } from "../core";

export const initExperience = (): void => {
  const shelf =
    document.querySelector<HTMLElement>(".experience-shelf");
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".shelf-item"),
  );
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(".dossier-card"),
  );
  const drawers = Array.from(
    document.querySelectorAll<HTMLElement>(".mobile-details-drawer"),
  );
  const panel = document.querySelector<HTMLElement>(".dossier-panel");
  const connector =
    document.querySelector<HTMLElement>(".shelf-connector-line");
  let activeIndex = 0;

  if (!shelf || !panel || !buttons.length || buttons.length !== cards.length) {
    return;
  }

  const animateCard = (card: HTMLElement): void => {
    if (reducedMotion.matches) return;
    card.classList.remove("pixel-wipe-in");
    void card.offsetWidth;
    card.classList.add("pixel-wipe-in");
  };

  const positionConnector = (): void => {
    if (mobileLayout.matches || !connector) {
      connector?.classList.remove("visible");
      return;
    }
    const button = buttons[activeIndex];
    connector.style.setProperty(
      "--connector-y",
      `${button.offsetTop + button.offsetHeight / 2}px`,
    );
    connector.classList.add("visible");
  };

  const activate = (index: number, focus = false): void => {
    activeIndex = (index + buttons.length) % buttons.length;
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === activeIndex;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.setAttribute(
        "aria-expanded",
        mobileLayout.matches ? String(selected) : "false",
      );
    });
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("active", cardIndex === activeIndex);
    });
    drawers.forEach((drawer, drawerIndex) => {
      drawer.classList.toggle(
        "is-open",
        mobileLayout.matches && drawerIndex === activeIndex,
      );
    });
    animateCard(cards[activeIndex]);
    window.dispatchEvent(
      new CustomEvent("portfolio:experience-change", {
        detail: { index: activeIndex },
      }),
    );
    window.requestAnimationFrame(positionConnector);
    if (focus) buttons[activeIndex].focus();
  };

  const arrange = (): void => {
    if (mobileLayout.matches) {
      shelf.removeAttribute("role");
      buttons.forEach((button) => button.removeAttribute("role"));
      cards.forEach((card, index) => drawers[index]?.append(card));
    } else {
      shelf.setAttribute("role", "tablist");
      buttons.forEach((button) => button.setAttribute("role", "tab"));
      cards.forEach((card) => panel.append(card));
      drawers.forEach((drawer) => drawer.classList.remove("is-open"));
    }
    activate(activeIndex);
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (mobileLayout.matches && activeIndex === index) {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        button.classList.toggle("active", open);
        cards[index].classList.toggle("active", open);
        drawers[index]?.classList.toggle("is-open", open);
        if (open) {
          window.dispatchEvent(
            new CustomEvent("portfolio:experience-change", {
              detail: { index },
            }),
          );
        }
        return;
      }
      activate(index);
    });
    button.addEventListener("keydown", (event) => {
      if (mobileLayout.matches) return;
      const targets: Partial<Record<string, number>> = {
        ArrowDown: index + 1,
        ArrowRight: index + 1,
        ArrowUp: index - 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: buttons.length - 1,
      };
      const target = targets[event.key];
      if (target === undefined) return;
      event.preventDefault();
      activate(target, true);
    });
  });

  mobileLayout.addEventListener("change", arrange);
  window.addEventListener("resize", positionConnector);
  arrange();
};
