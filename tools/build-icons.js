/**
 * Рендерит иконки из assets/bus-core.svg (логотип + бейдж Cursor уже внутри).
 * npm i sharp to-ico png2icons
 * node tools/build-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');
const png2icons = require('png2icons');

const ASSETS = path.join(__dirname, '..', 'assets');
const CORE = path.join(ASSETS, 'bus-core.svg');

async function main() {
  if (!fs.existsSync(CORE)) throw new Error('нет assets/bus-core.svg');
  const png1024 = await sharp(CORE).resize(1024, 1024).png().toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'bus.png'), png1024);

  const full = png1024.toString('base64');
  fs.writeFileSync(
    path.join(ASSETS, 'bus.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" role="img" aria-label="Bus Cursor">\n  <image width="256" height="256" href="data:image/png;base64,${full}" xlink:href="data:image/png;base64,${full}"/>\n</svg>\n`
  );

  const png16 = await sharp(CORE).resize(16, 16).png().toBuffer();
  const s16 = png16.toString('base64');
  fs.writeFileSync(
    path.join(ASSETS, 'bus-small.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16">\n  <image width="16" height="16" href="data:image/png;base64,${s16}" xlink:href="data:image/png;base64,${s16}"/>\n</svg>\n`
  );

  const icos = [];
  for (const s of [16, 24, 32, 48, 64, 128, 256]) icos.push(await sharp(CORE).resize(s, s).png().toBuffer());
  fs.writeFileSync(path.join(ASSETS, 'bus.ico'), await toIco(icos));

  const icns = png2icons.createICNS(png1024, png2icons.BILINEAR, 0);
  if (icns) fs.writeFileSync(path.join(ASSETS, 'bus.icns'), icns);
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
