import { openSync } from 'fontkit';

export const fontURL = new URL(
  '../test/data/OpenSans/OpenSans-Regular.ttf',
  import.meta.url,
);

// Keep the two requested lines independent. Their boxes must never be unioned.
export const previewLines = [
  {
    id: 'abc-ef',
    label: 'abc ef',
    text: 'abc ef',
    output: new URL('./out.svg', import.meta.url),
  },
  {
    id: 'combining-acute',
    label: 'combining acute U+0301',
    text: String.fromCodePoint(0x0301),
    codepoint: 'U+0301',
    output: new URL('./out-acute.svg', import.meta.url),
  },
];

export function openPreviewFont() {
  return openSync(fontURL);
}

/**
 * Read one line's box from the same GlyphRun#bbox implementation used by
 * tests/measurement. Do not copy or hard-code the four edges in callers.
 */
export function measureLine(font, line) {
  const spec =
    typeof line === 'string' ? { id: null, label: line, text: line } : line;
  const run = font.layout(spec.text);
  const bbox = run.bbox;
  const left = bbox.minX;
  const bottom = bbox.minY;
  const right = bbox.maxX;
  const top = bbox.maxY;
  const width = right - left;
  const height = top - bottom;

  return {
    id: spec.id,
    label: spec.label,
    text: spec.text,
    output: spec.output,
    run,
    left,
    bottom,
    right,
    top,
    width,
    height,
    advanceWidth: run.advanceWidth,
    // SVG viewBox is min-x, min-y, width, height with a y-down origin.
    // The four raw edges remain left, bottom, right, top above.
    viewBox: `${left} ${-top} ${width} ${height}`,
  };
}

export function measurePreviewLines(font = openPreviewFont()) {
  return previewLines.map((line) => measureLine(font, line));
}

export function formatBoxReading(source, reading) {
  const name = reading.id ? `${reading.id} (${reading.label})` : reading.label;
  let line =
    `[${source}] ${name}: ` +
    `bbox(left bottom right top)=${reading.left} ${reading.bottom} ` +
    `${reading.right} ${reading.top} ` +
    `advance=${reading.advanceWidth} ` +
    `viewBox="${reading.viewBox}"`;

  if (reading.output) {
    line += ` output=${filePathForLog(reading.output)}`;
  }

  return line;
}

export function printBoxReadings(source, readings = measurePreviewLines()) {
  for (const reading of readings) {
    console.log(formatBoxReading(source, reading));
  }
}

function filePathForLog(url) {
  return url.pathname.replace(process.cwd() + '/', '');
}
