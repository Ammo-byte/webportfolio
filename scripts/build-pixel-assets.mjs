import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconSource = path.join(root, "node_modules/pixelarticons/svg");
const iconOutput = path.join(root, "assets/Images/pixel/icons");

const icons = [
  "arrow-up",
  "arrow-right",
  "book-open",
  "box",
  "briefcase",
  "chart",
  "chart-column-decreasing",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "close",
  "cloud",
  "cloud-sun",
  "database",
  "date-time",
  "download",
  "external-link",
  "eye",
  "file-text",
  "git-branch",
  "link",
  "mail",
  "moon",
  "repeat",
  "search",
  "send",
  "settings-cog",
  "shield",
  "target",
  "terminal",
  "contact",
  "users",
  "warning-diamond",
  "zap",
];

await mkdir(iconOutput, { recursive: true });

await Promise.all(
  icons.map(async (name) => {
    const sourcePath = path.join(iconSource, `${name}.svg`);
    await sharp(sourcePath)
      .resize(24, 24, { fit: "fill", kernel: "nearest" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(iconOutput, `${name}.png`));
  }),
);
