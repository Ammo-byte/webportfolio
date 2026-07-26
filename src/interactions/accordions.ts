export const initAccordions = (): void => {
  document.querySelectorAll<HTMLElement>(".mini-list-row").forEach((row) => {
    const button =
      row.querySelector<HTMLButtonElement>(".mini-list-header");
    button?.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      row.classList.toggle("open", open);
    });
  });
};
