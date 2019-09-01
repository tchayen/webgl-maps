import http from 'http';
import fs from 'fs';
import readline from 'readline';
import osmToGeoJson from 'osmtogeojson';

const humanFileSize = (bytes: number) => {
  const thresh = 1000;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return `${bytes.toFixed(1)} ${units[u]}`;
};

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

const prepareQuery = () => {
  const roadTypes = [
    'motorway',
    'motorway_link',
    'trunk',
    'trunk_link',
    'primary',
    'primary_link',
    'secondary',
    'secondary_link',
    'tertiary',
    'tertiary_link',
    'road',
    'living_street',
    'pedestrian',
    'residential',
    'unclassified',
  ];

  const water = `
    relation["water"~"river"];
    way["water"~"river"];
    way["waterway"~"riverbank|dock"];
    relation["waterway"~"riverbank|dock"];
  `;

  const greens = `
    way[leisure=park];
    relation[leisure=park];
    way["landuse"="forest|allotments|meadow"];
    relation["landuse"="forest|allotments|meadow"];
  `;

  const roads = `way["highway"~"${roadTypes.join('|')}"];`;

  const query = `
    [out:json][bbox:50.0,19.85,50.105,20.13];
    (
      ${water}
      ${greens}
      ${roads}
    );
    (._;>;);
    out;
  `;

  return query;
};

const hideCursor = '\x1B[?25l';
const showCursor = '\x1B[?25h\n';

const fetch = (query: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    const path = encodeURI(query.replace(/\s+/g, ''));
    const options = {
      hostname: 'overpass-api.de',
      port: 80,
      path: `/api/interpreter?data=${path}`,
      method: 'GET',
    };

    const request = http.request(options);
    request.on('response', response => {
      let total = 0;
      process.stdout.write(hideCursor);
      readline.cursorTo(process.stdout, 0);

      response.on('data', chunk => {
        data += chunk;
        const current = chunk.length;
        total += current;

        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
        process.stdout.write(`Downloaded ${humanFileSize(total)}`);
      });

      response.on('end', () => {
        process.stdout.write(showCursor);
        resolve(data);
      });

      response.on('error', error => {
        reject(error);
      });
    });
    request.end();
  });

const run = async () => {
  const [_node, _file, userPath] = process.argv;
  const path = userPath || `../out/map.json`;
  const query = prepareQuery();
  const data = await fetch(query);
  const osm = JSON.parse(data);
  const geoJson = osmToGeoJson(osm);
  await saveFile(path, JSON.stringify(geoJson));
  console.log(`Saved to ${path}`);
};

run();
