import { Point } from '../types';

const scale = ([x, y]: Point, factor: number): Point => {
  const norm = Math.sqrt(x * x + y * y);
  return [(x / norm) * factor, (y / norm) * factor];
};

const add = (p1: Point, p2: Point): Point => [p1[0] + p2[0], p1[1] + p2[1]];

export const normal = (points: Array<Point>, width: number) => {
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
