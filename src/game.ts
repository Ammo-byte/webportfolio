import { currentTheme, type GameBridge, type Theme } from "./core";

type GameMessage =
  | { source: "aamo-portfolio"; theme: Theme; type: "theme" }
  | { source: "aamo-portfolio"; type: "pause" | "resume" };

export const initGameBridge = (): GameBridge => {
  const iframe = document.querySelector<HTMLIFrameElement>("#indy-game-iframe");
  const frame = iframe?.parentElement;

  const post = (message: GameMessage): void => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(message, window.location.origin);
  };

  const postTheme = (theme: Theme): void => {
    post({ source: "aamo-portfolio", theme, type: "theme" });
  };

  return {
    load(): void {
      if (!iframe || !frame || iframe.hasAttribute("src")) return;
      const source = iframe.dataset.src;
      if (!source) return;
      if (!iframe.isConnected) frame.append(iframe);
      iframe.addEventListener(
        "load",
        () => {
          postTheme(currentTheme());
          post({ source: "aamo-portfolio", type: "resume" });
        },
        { once: true },
      );
      iframe.src = source;
    },
    setTheme(theme: Theme): void {
      postTheme(theme);
    },
    pause(paused: boolean): void {
      post({
        source: "aamo-portfolio",
        type: paused ? "pause" : "resume",
      });
    },
    unload(): void {
      if (!iframe) return;
      iframe.remove();
      iframe.removeAttribute("src");
    },
  };
};
