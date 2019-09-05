import font from '../out/spacing.json';
import edt from './edt';
import pack from './pack';

const alphabet =
  '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

const INF = 1e20;

export type Dictionary<T> = { [key: string]: T };

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Glyph = {
  x: number;
  y: number;
  width: number;
  height: number;
  lsb: number;
  rsb: number;
};

type Config = {
  font: Dictionary<Glyph>;
  fontSize: number;
  unitsPerEm: number;
};

const generateTexture = (config: Config) => {
  const { font, fontSize, unitsPerEm } = config;

  const buffer = fontSize / 8;
  const radius = fontSize / 3;
  const cutoff = 0.25;

  const scale = (1 / unitsPerEm) * fontSize;

  const transform = (x: number) => Math.ceil(x * scale);

  const boxes = alphabet.split('').map(letter => {
    const { width, height } = (font as any)[letter];
    return {
      letter,
      width: transform(width) + buffer * 2,
      height: transform(height) + buffer * 2,
    };
  });

  const { width, height, sizes } = pack(boxes);

  const pixelRatio = window.devicePixelRatio;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('style', `width:${width}px;height:${height}px`);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  document.body.appendChild(canvas);

  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('Failed to get context');
  }

  context.scale(pixelRatio, pixelRatio);

  context.font = `${fontSize}px Inter`;
  context.fillStyle = 'black';

  context.clearRect(0, 0, width, height);

  const sortedAlphabet = alphabet
    .split('')
    .sort((a: any, b: any) => a.charCodeAt(0) - b.charCodeAt(0));
  sizes.sort(
    (a: any, b: any) => a.letter.charCodeAt(0) - b.letter.charCodeAt(0),
  );

  for (let i = 0; i < alphabet.length; i++) {
    context.fillText(
      sortedAlphabet[i],
      sizes[i].x - (font as any)[sortedAlphabet[i]].x * scale + buffer,
      sizes[i].y +
        sizes[i].height +
        (font as any)[sortedAlphabet[i]].y * scale -
        buffer,
    );
  }

  const w = Math.round(width * pixelRatio);
  const h = Math.round(height * pixelRatio);

  const imageData = context.getImageData(0, 0, w, h);
  const alphaChannel = new Uint8ClampedArray(w * h);

  const gridOuter = new Float64Array(w * h);
  const gridInner = new Float64Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const a = imageData.data[i * 4 + 3] / 255; // Alpha value.
    gridOuter[i] =
      a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
    gridInner[i] =
      a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
  }

  const s = Math.max(w, h);
  const f = new Float64Array(s);
  const z = new Float64Array(s + 1);
  const v = new Uint16Array(s * 2);

  edt(gridOuter, w, h, f, v, z);
  edt(gridInner, w, h, f, v, z);

  for (let i = 0; i < w * h; i++) {
    const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
    alphaChannel[i] = Math.round(255 - 255 * (d / radius + cutoff));
  }

  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[4 * i + 0] = alphaChannel[i];
    data[4 * i + 1] = alphaChannel[i];
    data[4 * i + 2] = alphaChannel[i];
    data[4 * i + 3] = 255;
  }

  const metadata: Dictionary<Rectangle> = {};
  for (let i = 0; i < alphabet.length; i++) {
    const { x, y, width, height } = sizes[i];
    metadata[alphabet[i]] = { x, y, width, height };
  }

  // For display purposes.
  context.putImageData(new ImageData(data, w, h), 0, 0);

  return { width: w, height: h, data, metadata };
};

const run = async () => {
  const config = {
    font,
    fontSize: 48,
    unitsPerEm: 2816,
  };

  const { width, height, metadata } = generateTexture(config);

  console.log(JSON.stringify({ width, height, metadata }));
};

run();
