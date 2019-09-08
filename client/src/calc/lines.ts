import { Point } from '../types';

const normalize = (p: Point): Point => scale(p, 1);
const add = (p1: Point, p2: Point): Point => [p1[0] + p2[0], p1[1] + p2[1]];
const sub = (p1: Point, p2: Point): Point => [p1[0] - p2[0], p1[1] - p2[1]];
const dot = (p1: Point, p2: Point): number => p1[0] * p2[0] + p1[1] * p2[1];

const scale = ([x, y]: Point, factor: number): Point => {
  const norm = Math.sqrt(x * x + y * y);
  return [(x / norm) * factor, (y / norm) * factor];
};

export const normal = (points: Array<Point>, width: number) => {
  if (points.length < 2) {
    throw new Error("Can't make line with less than two points");
  }

  width /= 2;
  const triangles = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    const n1 = scale([dy, -dx], width);
    const n2 = scale([-dy, dx], width);

    triangles.push(
      ...add(points[i + 1], n2),
      ...add(points[i], n2),
      ...add(points[i], n1),
      ...add(points[i], n1),
      ...add(points[i + 1], n1),
      ...add(points[i + 1], n2),
    );
  }
  return triangles;
};

const calculateNormals = (x: number, y: number) =>
  ([[y, -x], [-y, x]] as Array<Point>).map((p: Point) => normalize(p));

export const miter = (points: Array<Point>, width: number) => {
  if (points.length < 3) {
    return normal(points, width);
  }

  width /= 2;
  const triangles = [];
  let dx, dy, miter1, miter2, n1, n2;

  dx = points[1][0] - points[0][0];
  dy = points[1][1] - points[0][1];
  n2 = calculateNormals(dx, dy);
  miter2 = scale(n2[0], width);

  for (let i = 1; i < points.length - 1; i++) {
    n1 = n2;
    miter1 = miter2;
    dx = points[i + 1][0] - points[i][0];
    dy = points[i + 1][1] - points[i][1];
    n2 = calculateNormals(dx, dy);

    // Find tangent vector to both lines in the middle point.
    const tangent = normalize(
      add(
        normalize(sub(points[i + 1], points[i])),
        normalize(sub(points[i], points[i - 1])),
      ),
    );

    // Miter vector is perpendicular to the tangent and crosses extensions of
    // normal-translated lines in miter join points.
    const unitMiter: Point = [-tangent[1], tangent[0]];

    // Length of the miter vector projected onto one of the normals.
    // Choice of normal is arbitrary, each of them would work.
    const miterLength = width / dot(unitMiter, n1[0]);
    miter2 = scale(unitMiter, miterLength);

    triangles.push(
      ...sub(points[i], miter2),
      ...sub(points[i - 1], miter1),
      ...add(points[i - 1], miter1),
      ...add(points[i - 1], miter1),
      ...add(points[i], miter2),
      ...sub(points[i], miter2),
    );
  }

  // Use last normal as another 'neutral element' for miter join.
  const n = points.length;
  const lastMiter = scale(n2[0], width);

  triangles.push(
    ...sub(points[n - 1], lastMiter),
    ...sub(points[n - 2], miter1 as Point),
    ...add(points[n - 2], miter1 as Point),
    ...add(points[n - 2], miter1 as Point),
    ...add(points[n - 1], lastMiter),
    ...sub(points[n - 1], lastMiter),
  );
  return triangles;
};
