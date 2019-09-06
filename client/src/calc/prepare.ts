import { normal } from './lines';
import { degreesToMeters } from './geo';
import { linkedList, earCut } from './triangulation';
import { GeoJsonData, Dict, Color, Feature, Object, Point } from '../types';
import geoJson from '../data.json';

const data = geoJson as GeoJsonData;

let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;

const lookForBoundaries = (x: number, y: number) => {
  if (x < minX) minX = x;
  if (y < minY) minY = y;
  if (x > maxX) maxX = x;
  if (y > maxY) maxY = y;
};

export const colors: Dict<Color> = {
  water: [0, 0, 0],
  background: [0.6, 0.6, 0.6],
  primaryRoads: [1, 1, 1],
  secondaryRoads: [0.9, 0.9, 0.9],
  tertiaryRoads: [0.7, 0.7, 0.7],
  greens: [0.7, 0.7, 0.7],
  other: [0.6, 0, 0.6],
};

// export const colors: Dict<Color> = {
//   water: [0.666, 0.855, 1],
//   background: [0.929, 0.925, 0.921],
//   primaryRoads: [1, 1, 1], // primaryRoads: [1, 0.949, 0.686],
//   secondaryRoads: [1, 1, 1],
//   tertiaryRoads: [1, 1, 1],
//   greens: [0.753, 0.925, 0.682],
//   other: [1, 1, 1],
// };

export const objects: Array<Object> = [
  {
    key: 'primary-roads',
    match: (feature: Feature) => {
      if (typeof feature.properties.highway !== 'string') {
        return false;
      }

      const regex = /(motorway|motorway_link|trunk|trunk_link|primary|primary_link)/;
      return regex.test(feature.properties.highway);
    },
    shapes: [],
    vertices: [],
    color: colors.primaryRoads,
    width: 2,
    type: 'lines',
  },
  {
    key: 'secondary-roads',
    match: (feature: Feature) => {
      if (typeof feature.properties.highway !== 'string') {
        return false;
      }

      const regex = /(secondary|secondary_link|tertiary|tertiary_link|road)/;
      return regex.test(feature.properties.highway);
    },
    shapes: [],
    vertices: [],
    color: colors.secondaryRoads,
    width: 1.5,
    type: 'lines',
  },
  {
    key: 'tertiary',
    match: (feature: Feature) => {
      if (typeof feature.properties.highway !== 'string') {
        return false;
      }

      const regex = /(living_street|pedestrian|residential|unclassified)/;
      return regex.test(feature.properties.highway);
    },
    shapes: [],
    vertices: [],
    color: colors.tertiaryRoads,
    width: 1,
    type: 'lines',
  },
  {
    key: 'water',
    match: (feature: Feature) =>
      feature.properties.water === 'river' &&
      feature.geometry.type === 'Polygon',
    shapes: [],
    vertices: [],
    color: colors.water,
    type: 'polygons',
  },
  {
    key: 'greens',
    match: (feature: Feature) =>
      feature.properties.leisure === 'park' ||
      (feature.properties.landuse !== undefined &&
        /(forest|allotments|meadow)/.test(feature.properties.landuse)),
    shapes: [],
    vertices: [],
    color: colors.greens,
    type: 'polygons',
  },
];

const processPoint = (point: Point): Point => {
  const { x, y } = degreesToMeters(point[1], point[0]);
  lookForBoundaries(x, y);
  return [x, y];
};

data.features.forEach((feature: Feature) => {
  objects.forEach(object => {
    if (object.match(feature)) {
      if (feature.geometry.type === 'LineString') {
        object.shapes.push(feature.geometry.coordinates.map(processPoint));
      }

      if (feature.geometry.type === 'Polygon') {
        object.shapes.push(feature.geometry.coordinates[0].map(processPoint));
      }
    }
  });
});

const targetWidth = 2000;
const factor = (maxX - minX) / targetWidth;

// Takes the previous array, 'normalizes' coordinates by subtracting
// minimum value on both axes and scales it.
const processPolygon = (polygon: Array<Point>): Array<Point> =>
  polygon
    .map(p => [p[0] - minX, p[1] - minY])
    .map(p => [p[0] / factor, p[1] / factor]);

objects.forEach(object => {
  const shapes = object.shapes.map(processPolygon).map((polygon, i) => {
    let triangulated = null;
    try {
      if (object.type === 'lines') {
        triangulated = normal(polygon, object.width);
      } else {
        const flat = polygon.flat();
        const node = linkedList(flat);
        if (node === undefined) {
          throw new Error('Failed to triangulate shape');
        }
        const triangles = earCut(node);
        const vertices = triangles.flatMap(i => [flat[2 * i], flat[2 * i + 1]]);
        triangulated = vertices;
      }
    } catch (_) {
      const error = JSON.stringify(object.vertices);
      console.log(`Polygon ${i} was problematic. Snapshot: ${error}`);
    } finally {
      return triangulated;
    }
  });

  // Join everything together for rendering (because it's just triangles,
  // as long as we use the same set of shaders, it can be one big blob
  // sent to the GPU).
  object.vertices = shapes.flat(2);
});
