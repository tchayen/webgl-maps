export type Dict<T> = { [key: string]: T };

export type Point = [number, number];

export type Color = [number, number, number];

export type Properties = {
  name?: string;
  water?: string;
  highway?: string;
  leisure?: string;
  landuse?: string;
};

export type Feature =
  | {
      type: 'Feature';
      geometry: {
        type: 'LineString';
        coordinates: Array<Point>;
      };
      properties: Properties;
    }
  | {
      type: 'Feature';
      geometry: {
        type: 'Polygon';
        coordinates: Array<Array<Point>>;
      };
      properties: Properties;
    };

export type GeoJsonData = { features: Array<Feature> };

export type Object =
  | {
      key: string;
      match: (feature: Feature) => Boolean;
      shapes: Array<Array<Point>>;
      vertices: Array<Point>;
      color: Color;
      width: number;
      type: 'lines';
    }
  | {
      key: string;
      match: (feature: Feature) => Boolean;
      shapes: Array<Array<Point>>;
      vertices: Array<Point>;
      color: Color;
      type: 'polygons';
    };

export type Path = {
  angle: number;
  length: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

export type VehicleInput = {
  id: number;
  tripId: number;
  category: 'tram';
  longitude: number;
  latitude: number;
  name: string;
  heading: number;
  color: string;
  path: Array<Path>;
  isDeleted?: Boolean;
};

export type Vehicle = {
  angle: number;
  position: Point;
};
