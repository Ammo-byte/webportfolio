import { createPixelIcon } from "../icons";

const wrap = (index: number, length: number): number =>
  (index + length) % length;

export const initCarousel = (): void => {
  const carousel = document.querySelector<HTMLElement>(".coverflow");
  const track = carousel?.querySelector<HTMLElement>(".coverflow-track");
  const cards = Array.from(
    carousel?.querySelectorAll<HTMLElement>(".coverflow-card") ?? [],
  );
  const dotsContainer =
    carousel?.querySelector<HTMLElement>(".coverflow-dots");
  const previous =
    carousel?.querySelector<HTMLButtonElement>(".coverflow-prev");
  const next = carousel?.querySelector<HTMLButtonElement>(".coverflow-next");
  if (!carousel || !track || !cards.length || !dotsContainer) return;

  let current = 0;
  let expanded = -1;
  let pointerId: number | null = null;
  let pointerStart = 0;
  let dragOffset = 0;
  let suppressClick = false;

  const closeDetail = (): void => {
    if (expanded < 0) return;
    const card = cards[expanded];
    card.classList.remove("is-expanded");
    card.querySelector<HTMLElement>(".coverflow-data")?.setAttribute(
      "hidden",
      "",
    );
    carousel.classList.remove("has-expanded-card");
    expanded = -1;
    render();
    card.querySelector<HTMLButtonElement>(".coverflow-cover")?.focus();
  };

  const openDetail = (index: number): void => {
    expanded = index;
    carousel.classList.add("has-expanded-card");
    cards[index].classList.add("is-expanded");
    cards[index]
      .querySelector<HTMLElement>(".coverflow-data")
      ?.removeAttribute("hidden");
    cards[index]
      .querySelector<HTMLButtonElement>(".coverflow-close")
      ?.focus();
  };

  const update = (index: number): void => {
    if (expanded >= 0) closeDetail();
    current = wrap(index, cards.length);
    carousel.classList.add("is-settling");
    render();
    window.setTimeout(() => carousel.classList.remove("is-settling"), 360);
  };

  const dots = cards.map((card, index) => {
    const dot = document.createElement("button");
    dot.className = "coverflow-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show project ${index + 1}`);
    dot.addEventListener("click", () => update(index));
    dotsContainer.append(dot);

    const label = card.querySelector(".coverflow-cover-label");
    if (label && !label.querySelector(".coverflow-action")) {
      const action = document.createElement("span");
      action.className = "coverflow-action";
      action.textContent = "OPEN PROJECT";
      label.append(action);
    }

    const close = document.createElement("button");
    close.className = "coverflow-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close project details");
    close.append(createPixelIcon("close"));
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDetail();
    });
    card.append(close);
    card
      .querySelector<HTMLButtonElement>(".coverflow-cover")
      ?.addEventListener("click", () => {
        if (suppressClick) return;
        if (current === index) openDetail(index);
        else update(index);
      });
    return dot;
  });

  function deltaFromCurrent(index: number): number {
    let delta = index - current;
    const half = cards.length / 2;
    if (delta > half) delta -= cards.length;
    if (delta < -half) delta += cards.length;
    return delta;
  }

  function render(): void {
    const spacing =
      window.innerWidth < 620 ? 170 : window.innerWidth < 900 ? 220 : 286;
    cards.forEach((card, index) => {
      const delta = deltaFromCurrent(index);
      const distance = Math.abs(delta);
      const visible = distance <= 2;
      const active = index === current;
      const opacity = distance === 0 ? 1 : distance === 1 ? 0.76 : 0.52;
      const scale = distance === 0 ? 1 : distance === 1 ? 0.92 : 0.84;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-hidden", String(!visible && index !== expanded));
      card.style.zIndex = String(20 - distance);
      card.style.opacity = visible ? String(opacity) : "0";
      card.style.pointerEvents = visible ? "auto" : "none";
      if (index !== expanded) {
        const directDrag = pointerId === null ? 0 : dragOffset;
        card.style.transform =
          `translateX(${delta * spacing + directDrag}px) ` +
          `translateZ(${-distance * 135}px) rotateY(${delta * -16}deg) ` +
          `scale(${scale})`;
      }
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
      dot.setAttribute("aria-current", index === current ? "true" : "false");
    });
  }

  previous?.addEventListener("click", () => update(current - 1));
  next?.addEventListener("click", () => update(current + 1));
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && expanded >= 0) {
      event.preventDefault();
      closeDetail();
    } else if (expanded < 0 && event.key === "ArrowLeft") {
      event.preventDefault();
      update(current - 1);
    } else if (expanded < 0 && event.key === "ArrowRight") {
      event.preventDefault();
      update(current + 1);
    }
  });
  track.addEventListener("pointerdown", (event) => {
    if (expanded >= 0) return;
    pointerId = event.pointerId;
    pointerStart = event.clientX;
    dragOffset = 0;
    suppressClick = false;
    track.setPointerCapture(event.pointerId);
    carousel.classList.add("is-dragging");
  });
  track.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    dragOffset = event.clientX - pointerStart;
    if (Math.abs(dragOffset) > 8) suppressClick = true;
    render();
  });
  const finishDrag = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    const distance = dragOffset;
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    pointerId = null;
    dragOffset = 0;
    carousel.classList.remove("is-dragging");
    if (Math.abs(distance) > 54) update(current + (distance < 0 ? 1 : -1));
    else render();
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  };
  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", render);

  const inviteObserver = new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0]?.isIntersecting) return;
      cards[current].classList.add("is-invited");
      window.setTimeout(
        () => cards[current].classList.remove("is-invited"),
        760,
      );
      observer.disconnect();
    },
    { threshold: 0.45 },
  );
  inviteObserver.observe(carousel);
  render();
};
