import fs from 'fs';
import ttf from './ttf';
import binaryFile from './binaryFile';
import { Ttf, Dictionary, Glyph } from './types';

const alphabet =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

const readFile = (fileName: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });

const saveFile = (fileName: string, data: string) =>
  new Promise((resolve, reject) => {
    if (typeof data !== 'string') {
      const error = new Error('Only strings can be written to file');
      reject(error);
    }

    fs.writeFile(fileName, data, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const generateSpacing = (ttfFile: Ttf) => {
  const map: Dictionary<Glyph> = {};
  alphabet.split('').forEach(char => {
    const index = ttfFile.glyphIndexMap[char.codePointAt(0) || 0] || 0;
    const glyf = ttfFile.glyf[index];
    const hmtx = ttfFile.hmtx.hMetrics[index];

    map[char] = {
      x: glyf.xMin,
      y: glyf.yMin,
      width: glyf.xMax - glyf.xMin,
      height: glyf.yMax - glyf.yMin,
      lsb: hmtx.leftSideBearing,
      rsb: hmtx.advanceWidth - hmtx.leftSideBearing - (glyf.xMax - glyf.xMin),
    };
  });
  return map;
};

const run = async () => {
  const [_node, _file, type, input, output] = process.argv;

  if (input === '' || output === '') {
    throw new Error('You must provide input and output file');
  }

  const buffer = await readFile(input);
  const reader = binaryFile(buffer);
  const ttfFile = ttf(reader);

  if (type === 'ttf') {
    await saveFile(output, JSON.stringify(ttfFile));
  } else if (type === 'spacing') {
    const spacingFile = generateSpacing(ttfFile);
    await saveFile(output, JSON.stringify(spacingFile));
  } else {
    throw new Error('Unrecognized action');
  }
};

run();
