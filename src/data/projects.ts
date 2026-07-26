import type { Theme } from "../core";

const projectNames = [
  "project-game",
  "project-image",
  "project-music",
  "project-stock",
  "project-hockey",
  "project-sunday",
  "project-retail",
] as const;

export type ProjectArtworkName = (typeof projectNames)[number];

export const projectArtwork = projectNames.map((name) => ({
  dark: `/assets/Images/pixel/projects/${name}-dark.png`,
  light: `/assets/Images/pixel/projects/${name}-light.png`,
  name,
}));

export const projectArtworkSource = (
  name: string,
  theme: Theme,
): string =>
  projectArtwork.find((artwork) => artwork.name === name)?.[theme] ??
  projectArtwork[0][theme];
