import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/silkscreen/400.css";

import { PixelField } from "./animations/particles";
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
  value.charAt(0).toUpperCase() + value.slice(1);

const pokemonIdForToday = (): number => {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return (day % 1025) + 1;
};

const fetchPokemon = async (): Promise<void> => {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonIdForToday()}/`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pokemon = (await response.json()) as PokemonData;
    setText("#pokemon-name", capitalize(pokemon.name));
    setText("#pokemon-id", pokemon.id);
    setText("#pokemon-height", `${pokemon.height} dm`);
    setText("#pokemon-weight", `${pokemon.weight} hg`);
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
      image.src = imageSource;
      image.alt = pokemon.name;
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
    console.error("Pokemon fetch error:", error);
    setText("#pokemon-name", "Signal Lost");
    document.querySelector(".pokemon-card")?.classList.add("is-error");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const particles = new PixelField(
    document.querySelector<HTMLCanvasElement>("#particles-js"),
  );
  const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle");
  const favicon = document.querySelector<HTMLLinkElement>("#favicon");

  const applyTheme = (theme: Theme, persist = false): void => {
    root.dataset.theme = theme;
    const nextTheme = theme === "dark" ? "light" : "dark";
    toggle?.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    const icon = toggle?.querySelector<HTMLElement>("[data-icon]");
    if (icon) icon.dataset.icon = theme === "dark" ? "cloud-sun" : "moon";
    if (favicon) {
      favicon.href = `/assets/Images/favicons/favicon-${theme}-pixel.png`;
    }
    hydratePixelIcons();
    particles.setTheme(theme);
    if (persist) writeStorage(localStorage, "theme", theme);
  };

  hydratePixelIcons();
  applyTheme(currentTheme());
  toggle?.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
  });
  void fetchPokemon();
});
