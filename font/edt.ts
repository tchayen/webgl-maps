// http://cs.brown.edu/people/pfelzens/papers/dt-final.pdf

const INF = 1e20;

// 1D squared distance transform.
const edt1d = (
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array,
) => {
  let q: number, k: number, s: number, r: number;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (q = 0; q < length; q++) f[q] = grid[offset + q * stride];
  for (q = 1, k = 0, s = 0; q < length; q++) {
    do {
      r = v[k];
      s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    r = v[k];
    grid[offset + q * stride] = f[r] + (q - r) * (q - r);
  }
};

const edt = (
  data: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array,
) => {
  for (let x = 0; x < width; x++) {
    edt1d(data, x, width, height, f, v, z);
  }
  for (let y = 0; y < height; y++) {
    edt1d(data, y * width, 1, width, f, v, z);
  }
};

export default edt;
