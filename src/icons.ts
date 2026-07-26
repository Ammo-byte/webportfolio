const iconRoot = "/assets/Images/pixel/icons";

export const hydratePixelIcons = (scope: ParentNode = document): void => {
  scope.querySelectorAll<HTMLElement>("[data-icon]").forEach((icon) => {
    const name = icon.dataset.icon;
    if (!name) return;
    icon.style.setProperty("--pixel-icon", `url("${iconRoot}/${name}.png")`);
  });
};

export const createPixelIcon = (name: string): HTMLSpanElement => {
  const icon = document.createElement("span");
  icon.className = "pixel-icon";
  icon.dataset.icon = name;
  icon.setAttribute("aria-hidden", "true");
  hydratePixelIcons(icon.parentNode ?? document);
  icon.style.setProperty("--pixel-icon", `url("${iconRoot}/${name}.png")`);
  return icon;
};
