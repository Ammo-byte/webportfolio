import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";

import { initBackgroundField } from "./animations/background";
import {
  currentTheme,
  root,
  writeStorage,
  type Theme,
} from "./core";
import { hydratePixelIcons } from "./icons";

interface PokemonData {
  abilities: Array<{ ability: { name: string } }>;
  base_experience: number;
  height: number;
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other: { "official-artwork": { front_default: string | null } };
  };
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  types: Array<{ type: { name: string } }>;
  weight: number;
}

const setText = (selector: string, value: string | number): void => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.textContent = String(value);
};

const capitalize = (value: string): string =>
  value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const pokemonIdForToday = (): number => {
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), 0, 0);
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const day = Math.floor((current - start) / 86_400_000);
  return (day % 1025) + 1;
};

const fetchPokemon = async (): Promise<void> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonIdForToday()}/`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pokemon = (await response.json()) as PokemonData;
    setText("#pokemon-name", capitalize(pokemon.name));
    setText("#pokemon-id", pokemon.id);
    setText("#pokemon-height", `${pokemon.height / 10} m`);
    setText("#pokemon-weight", `${pokemon.weight / 10} kg`);
    setText("#pokemon-base-experience", pokemon.base_experience);
    setText(
      "#pokemon-types",
      pokemon.types.map(({ type }) => capitalize(type.name)).join(", "),
    );
    setText(
      "#pokemon-abilities",
      pokemon.abilities
        .map(({ ability }) => capitalize(ability.name))
        .join(", "),
    );

    const image = document.querySelector<HTMLImageElement>("#pokemon-img");
    const imageSource =
      pokemon.sprites.other["official-artwork"].front_default ??
      pokemon.sprites.front_default;
    if (image && imageSource) {
      image.addEventListener("load", () => {
        image.hidden = false;
        const loading = document.querySelector<HTMLElement>("#pokemon-loading");
        if (loading) loading.hidden = true;
      }, { once: true });
      image.addEventListener("error", () => {
        setText("#pokemon-loading", "Artwork unavailable.");
      }, { once: true });
      image.src = imageSource;
      image.alt = `Official artwork of ${capitalize(pokemon.name)}`;
    } else {
      setText("#pokemon-loading", "No artwork for today’s Pokémon.");
    }

    const stats = document.querySelector<HTMLUListElement>("#pokemon-stats");
    stats?.replaceChildren(
      ...pokemon.stats.map(({ base_stat: value, stat }) => {
        const item = document.createElement("li");
        const label = document.createElement("strong");
        const score = document.createElement("span");
        label.textContent = capitalize(stat.name);
        score.textContent = String(value);
        item.append(label, score);
        return item;
      }),
    );
  } catch (error) {
    console.warn("Pokémon could not be loaded:", error);
    setText("#pokemon-name", "Pokémon unavailable");
    setText("#pokemon-loading", "Today’s Pokémon couldn’t load. You can still head back to the portfolio.");
    document.querySelector(".pokemon-card")?.classList.add("is-error");
  } finally {
    window.clearTimeout(timeout);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const background = initBackgroundField(
    document.querySelector<HTMLCanvasElement>("#site-background"),
  );
  const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle");
  const favicon = document.querySelector<HTMLLinkElement>("#favicon");
  const appleIcon = document.querySelector<HTMLLinkElement>("#apple-touch-icon");

  const applyTheme = (theme: Theme, persist = false): void => {
    root.dataset.theme = theme;
    const nextTheme = theme === "dark" ? "light" : "dark";
    toggle?.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    const icon = toggle?.querySelector<HTMLElement>("[data-icon]");
    if (icon) icon.dataset.icon = theme === "dark" ? "cloud-sun" : "moon";
    if (favicon) {
      favicon.href = `/assets/Images/favicons/favicon-${theme}.png?v=wordmark`;
    }
    if (appleIcon) {
      appleIcon.href = `/assets/Images/favicons/apple-touch-icon-${theme}.png?v=wordmark`;
    }
    hydratePixelIcons();
    background.setTheme(theme);
    if (persist) writeStorage(localStorage, "theme", theme);
  };

  hydratePixelIcons();
  applyTheme(currentTheme());
  toggle?.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
  });
  void fetchPokemon();
});
