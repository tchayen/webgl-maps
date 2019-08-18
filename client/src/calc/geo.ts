export const RADIUS = 6378137.0;

export const degreesToMeters = (lat: number, lng: number) => ({
  x: (RADIUS * lng * Math.PI) / 180.0,
  y: RADIUS * Math.atanh(Math.sin((lat * Math.PI) / 180.0)),
});
