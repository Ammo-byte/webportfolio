import { trapFocus } from "./accessibility";
import { body } from "./core";

export const initEmailModal = (): void => {
  const trigger = document.querySelector<HTMLButtonElement>("#email");
  const modal = document.querySelector<HTMLElement>("#email-modal");
  if (!trigger || !modal) return;
  let returnFocus: HTMLElement | null = null;

  const close = (): void => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    body.classList.remove("modal-open");
    returnFocus?.focus();
  };
  const open = (): void => {
    returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    modal.inert = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    window.setTimeout(
      () => modal.querySelector<HTMLButtonElement>(".modal-close")?.focus(),
      40,
    );
  };

  trigger.addEventListener("click", open);
  modal.querySelectorAll<HTMLElement>("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", close);
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else {
      trapFocus(modal, event);
    }
  });
};
