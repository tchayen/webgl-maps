interface Size {
  width: number;
  height: number;
}

const pack = (sizes: Array<Size>) => {
  let area = 0;
  let maxWidth = 0;

  let boxes = sizes.map(box => ({ x: 0, y: 0, ...box }));

  for (const box of boxes) {
    area += box.width * box.height;
    maxWidth = Math.max(maxWidth, box.width);
  }

  boxes.sort((a: any, b: any) => b.height - a.height);

  // Aim for a squarish resulting container. Slightly adjusted for sub-100%
  // space utilization.
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

  const regions = [{ x: 0, y: 0, width: startWidth, height: Infinity }];

  let width = 0;
  let height = 0;

  for (const box of boxes) {
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      if (box.width > region.width || box.height > region.height) {
        continue;
      }

      box.x = region.x;
      box.y = region.y;
      height = Math.max(height, box.y + box.height);
      width = Math.max(width, box.x + box.width);

      if (box.width === region.width && box.height === region.height) {
        const last = regions.pop();
        if (last === undefined) {
          throw new Error("Shouldn't happen");
        }
        if (i < regions.length) regions[i] = last;
      } else if (box.height === region.height) {
        region.x += box.width;
        region.width -= box.width;
      } else if (box.width === region.width) {
        region.y += box.height;
        region.height -= box.height;
      } else {
        regions.push({
          x: region.x + box.width,
          y: region.y,
          width: region.width - box.width,
          height: box.height,
        });
        region.y += box.height;
        region.height -= box.height;
      }
      break;
    }
  }

  return {
    width,
    height,
    sizes: boxes,
    fill: area / (width * height) || 0, // space utilization
  };
};

export default pack;
