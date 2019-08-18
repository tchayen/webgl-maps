let zoom = 0;
let offset = { x: 0, y: 0 };
let factor = 0.005;
let range: [number, number] = [0, 2];
let renderFunction = () => {};

const clamp = (number: number, range: [number, number]) =>
  Math.min(Math.max(number, range[0]), range[1]);

const handleScroll = (event: WheelEvent) => {
  const sign = event.deltaY >= 0 ? 1 : -1;
  const previous = Math.pow(1.01, zoom);
  zoom += sign * factor;
  zoom = clamp(zoom, range);
  const delta = Math.pow(1.01, zoom) - previous;
  offset.x -= event.offsetX * delta;
  offset.y -= event.offsetY * delta;

  requestAnimationFrame(renderFunction);
};

const handleMouseDown = () => {
  document.body.style.cursor = 'grabbing';
};

const handleMouseUp = () => {
  document.body.style.cursor = 'grab';
};

const handleMouseMove = (event: MouseEvent) => {
  if (event.buttons !== 1) return; // If mouse is not pressed
  offset.x -= event.movementX * Math.pow(1.01, zoom);
  offset.y -= event.movementY * Math.pow(1.01, zoom);
  requestAnimationFrame(renderFunction);
};

const handleResize = () => {
  requestAnimationFrame(renderFunction);
};

const bindListeners = () => {
  window.addEventListener('resize', handleResize, false);
  window.addEventListener('mousewheel', handleScroll as EventListener, false);
  window.addEventListener('mousedown', handleMouseDown, false);
  window.addEventListener('mouseup', handleMouseUp, false);
  window.addEventListener('mousemove', handleMouseMove, false);
};

const setupSlippyMap = (
  _render: () => void,
  _factor: number,
  _range: [number, number],
) => {
  renderFunction = _render;
  factor = _factor || factor;
  range = _range || range;
};

export { bindListeners, offset, setupSlippyMap, zoom };
