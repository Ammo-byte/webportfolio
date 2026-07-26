import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/silkscreen/400.css";

import { initArcade } from "./arcade";
import { initExperienceScenes } from "./animations/experience";
import { initLoader } from "./animations/loader";
import { PixelField } from "./animations/particles";
import { initGameBridge } from "./game";
import { hydratePixelIcons } from "./icons";
import { initAccordions } from "./interactions/accordions";
import { initCarousel } from "./interactions/carousel";
import { initExperience } from "./interactions/experience";
import { initEmailModal } from "./modals";
import { initNavigation } from "./navigation";
import { initReveals } from "./reveals";
import { initTheme } from "./theme";

const alignInitialSection = (): void => {
  if (!window.location.hash) return;
  const target = document.querySelector<HTMLElement>(window.location.hash);
  target?.scrollIntoView({ behavior: "auto", block: "start" });
};

document.addEventListener("DOMContentLoaded", () => {
  const particles = new PixelField(
    document.querySelector<HTMLCanvasElement>("#particles-js"),
  );
  const game = initGameBridge();
  hydratePixelIcons();
  initTheme(particles, game);
  initLoader();
  initNavigation();
  initReveals();
  initExperience();
  initExperienceScenes();
  initAccordions();
  initCarousel();
  initEmailModal();
  initArcade(particles, game);

  if (window.location.hash) {
    document.fonts?.ready.then(alignInitialSection);
    window.setTimeout(alignInitialSection, 360);
  }
});
