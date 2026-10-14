import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const output = path.resolve("assets/Images/favicons");

// PNG-backed ICO entries preserve the same antialiased lettering at each size.
const createIco = async (source) => {
  const sizes = [16, 32, 48, 96];
  const images = await Promise.all(
    sizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
  );
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  return Buffer.concat([header, ...images]);
};

for (const theme of ["light", "dark"]) {
  const source = await readFile(path.join(output, `wordmark-${theme}.svg`));
  const variants = [
    [`favicon-${theme}.png`, 96],
    [`apple-touch-icon-${theme}.png`, 180],
    [`app-icon-${theme}-192.png`, 192],
    [`app-icon-${theme}-512.png`, 512],
  ];
  await Promise.all(
    variants.map(([name, size]) =>
      sharp(source).resize(size, size).png().toFile(path.join(output, name)),
    ),
  );
  await writeFile(path.join(output, `favicon-${theme}.ico`), await createIco(source));
}

await copyFile(path.join(output, "favicon-light.ico"), path.resolve("favicon.ico"));
