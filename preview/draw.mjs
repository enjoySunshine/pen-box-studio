import fs from 'node:fs';
import {
  formatBoxReading,
  measurePreviewLines,
  openPreviewFont,
} from './line-boxes.mjs';

const font = openPreviewFont();
const readings = measurePreviewLines(font);

for (const reading of readings) {
  const svg = renderLineSVG(reading);
  fs.writeFileSync(reading.output, svg);
  console.log(formatBoxReading('preview', reading));
}

writeIndexHTML(readings);

function renderLineSVG(reading) {
  const { left, bottom, right, top, width, height, viewBox, run } = reading;
  const paths = renderGlyphsAtPenPositions(run);
  const pixelSize = renderedPixelSize(width, height);
  const edges = `${left} ${bottom} ${right} ${top}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${pixelSize.width}" height="${pixelSize.height}" preserveAspectRatio="xMidYMid meet" data-edges="${edges}" data-advance="${reading.advanceWidth}">
  <title>${reading.label}</title>
  <desc>Line bounding box edges left=${left}, bottom=${bottom}, right=${right}, top=${top}; advance=${reading.advanceWidth}.</desc>
  <rect x="${left}" y="${-top}" width="${width}" height="${height}" fill="#111827"/>
  <g transform="scale(1,-1)" fill="#f4f1ea">
    ${paths}
  </g>
  <rect x="${left}" y="${-top}" width="${width}" height="${height}" fill="none" stroke="#38bdf8" stroke-width="3" vector-effect="non-scaling-stroke"/>
</svg>
`;
}

function renderGlyphsAtPenPositions(run) {
  let penX = 0;
  let penY = 0;

  return run.glyphs
    .map((glyph, index) => {
      const position = run.positions[index];
      const x = penX + position.xOffset;
      const y = penY + position.yOffset;
      const d = glyph.path.toSVG();
      const transform = `translate(${round(x)} ${round(y)})`;
      penX += position.xAdvance;
      penY += position.yAdvance;

      return `<g transform="${transform}"><path d="${d}"/></g>`;
    })
    .join('\n    ');
}

function renderedPixelSize(width, height) {
  const maxWidth = 1200;
  const maxHeight = 720;
  const scale = Math.min(maxWidth / width, maxHeight / height, 2);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function writeIndexHTML(readings) {
  const figures = readings
    .map((reading) => {
      const file = new URL(reading.output).pathname.split('/').pop();
      return `  <figure>
    <figcaption><code>${reading.label}</code> — edges ${reading.left} ${reading.bottom} ${reading.right} ${reading.top}, advance ${reading.advanceWidth}, viewBox <code>${reading.viewBox}</code></figcaption>
    <img src="./${file}" alt="Preview of ${reading.id || reading.label}">
  </figure>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Line box preview</title>
  <style>
    body { margin: 2rem; background: #0b1020; color: #e5e7eb; font: 14px/1.5 system-ui, sans-serif; }
    figure { margin: 0 0 2rem; padding: 1rem; background: #111827; border-radius: 12px; }
    img { max-width: 100%; height: auto; background: #111827; }
    code { color: #7dd3fc; }
  </style>
</head>
<body>
${figures}
</body>
</html>
`;

  fs.writeFileSync(new URL('./index.html', import.meta.url), html);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
