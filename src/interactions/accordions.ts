export const initAccordions = (): void => {
  document.querySelectorAll<HTMLElement>(".mini-list-row").forEach((row) => {
    const button =
      row.querySelector<HTMLButtonElement>(".mini-list-header");
    const details = row.querySelector<HTMLElement>(".mini-list-details");
    if (!button) return;
    const setOpen = (open: boolean): void => {
      button.setAttribute("aria-expanded", String(open));
      row.classList.toggle("open", open);
      if (details) {
        details.inert = !open;
        details.setAttribute("aria-hidden", String(!open));
      }
    };
    setOpen(button.getAttribute("aria-expanded") === "true");
    button.addEventListener("click", () => {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
  });
};
