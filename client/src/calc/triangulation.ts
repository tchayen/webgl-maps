type Node = {
  i: number;
  x: number;
  y: number;
  prev: Node;
  next: Node;
};

const insertNode = (i: number, x: number, y: number, last?: Node) => {
  const p: any = { i, x, y };

  if (!last) {
    p.prev = p;
    p.next = p;
  } else {
    p.next = last.next;
    p.prev = last;
    last.next.prev = p;
    last.next = p;
  }
  return p;
};

const removeNode = (p: Node) => {
  p.next.prev = p.prev;
  p.prev.next = p.next;
};

const equals = (p1: Node, p2: Node) => p1.x === p2.x && p1.y === p2.y;

export const linkedList = (data: Array<number>) => {
  let i, last;
  for (i = 0; i < data.length; i += 2) {
    last = insertNode(i / 2, data[i], data[i + 1], last);
  }
  return filterPoints(last);
};

const filterPoints = (start?: Node, end?: Node) => {
  if (!start) return start;
  if (!end) end = start;
  let p = start,
    again;
  do {
    again = false;
    if (equals(p, p.next) || area(p.prev, p, p.next) === 0) {
      removeNode(p);
      p = end = p.prev;
      if (p === p.next) break;
      again = true;
    } else {
      p = p.next;
    }
  } while (again || p !== end);
  return end;
};

const isInTriangle = (a: Node, b: Node, c: Node, p: Node) =>
  (c.x - p.x) * (a.y - p.y) - (a.x - p.x) * (c.y - p.y) >= 0 &&
  (a.x - p.x) * (b.y - p.y) - (b.x - p.x) * (a.y - p.y) >= 0 &&
  (b.x - p.x) * (c.y - p.y) - (c.x - p.x) * (b.y - p.y) >= 0;

const area = (a: Node, b: Node, c: Node) =>
  (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

const isEar = (ear: Node) => {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;
  if (area(a, b, c) >= 0) return false;
  let p = ear.next.next;
  while (p !== ear.prev) {
    const inTriangle = isInTriangle(a, b, c, p);
    if (inTriangle && area(p.prev, p, p.next) >= 0) return false;
    p = p.next;
  }
  return true;
};

export const earCut = (ear: Node) => {
  const triangles = [];
  let next = ear.next;
  let prev = ear.prev;
  let stop = ear;
  while (prev !== next) {
    prev = ear.prev;
    next = ear.next;
    if (isEar(ear)) {
      triangles.push(prev.i, ear.i, next.i);
      removeNode(ear);
      // Skipping next vertex is a handy trick to achieve less so called
      // 'sliver triangles'.
      ear = next.next;
      stop = next.next;
      continue;
    }
    ear = next;
    if (ear === stop) {
      throw new Error('This triangulation was a disaster');
    }
  }
  return triangles;
};
