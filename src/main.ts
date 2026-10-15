import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";

import { initArcade } from "./arcade";
import { initExperienceScenes } from "./animations/experience";
import { initBackgroundField } from "./animations/background";
import { initPageMotion } from "./animations/page-motion";
import { initGameBridge } from "./game";
import { hydratePixelIcons } from "./icons";
import { initAccordions } from "./interactions/accordions";
import { initExperience } from "./interactions/experience";
import { initEmailModal } from "./modals";
import { initNavigation, scrollSectionIntoView } from "./navigation";
import { initReveals } from "./reveals";
import { initTheme } from "./theme";

const alignInitialSection = (): void => {
  if (!window.location.hash) return;
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) scrollSectionIntoView(target, "auto");
};

document.addEventListener("DOMContentLoaded", () => {
  const background = initBackgroundField(
    document.querySelector<HTMLCanvasElement>("#site-background"),
  );
  const game = initGameBridge();
  hydratePixelIcons();
  initTheme(background, game);
  initNavigation();
  initExperience();
  initExperienceScenes();
  initReveals();
  initPageMotion();
  initAccordions();
  initEmailModal();
  initArcade(background, game);

  if (window.location.hash) {
    document.fonts?.ready.then(alignInitialSection);
    window.setTimeout(alignInitialSection, 360);
  }
});
