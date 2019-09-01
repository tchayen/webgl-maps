export const setUpCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('style', `width: 100vw; height: 100vh`);
  document.body.appendChild(canvas);
  return canvas;
};

export const createShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
) => {
  const shader = gl.createShader(type);

  if (shader == null) {
    throw new Error(`Failed to create shader of type ${type}`);
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  gl.deleteShader(shader);
  const message = gl.getShaderInfoLog(shader) || 'Failed to create shader';
  throw new Error(message);
};

export const createProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) => {
  const program = gl.createProgram();

  if (program == null) {
    throw new Error('Failed to create program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  gl.deleteProgram(program);
  const message = gl.getProgramInfoLog(program) || 'Failed to create program';
  throw new Error(message);
};

export const resize = (gl: WebGLRenderingContext) => {
  const displayWidth = Math.floor(
    gl.canvas.clientWidth * window.devicePixelRatio,
  );
  const displayHeight = Math.floor(
    gl.canvas.clientHeight * window.devicePixelRatio,
  );

  if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    gl.canvas.width = displayWidth;
    gl.canvas.height = displayHeight;
  }
};
