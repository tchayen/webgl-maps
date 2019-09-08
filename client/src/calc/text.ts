import font from './font.json';
import spacing from './spacing.json';
import { createShader, createProgram } from './webgl';

const pixelRatio = window.devicePixelRatio;
const fontSize = 24;
const unitsPerEm = 2816;
const scale = (1 / unitsPerEm) * fontSize;
const buffer = 5;

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise(resolve => {
    const image = new Image();
    image.addEventListener('load', () => {
      resolve(image);
    });
    image.src = source;
  });

const boundingBoxToTriangles = (
  x: number,
  y: number,
  width: number,
  height: number,
) => [
  x,
  y,
  x,
  y + height,
  x + width,
  y,
  x,
  y + height,
  x + width,
  y + height,
  x + width,
  y,
];

export const setupTextRendering = (gl: WebGLRenderingContext) => {
  const vertex = `
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      v_texcoord = a_texcoord;
      gl_Position = u_matrix * a_position;
    }
  `;

  const fragment = `
    precision mediump float;
    varying vec2 v_texcoord;

    uniform vec4 u_color;
    uniform float u_buffer;
    uniform float u_gamma;
    uniform sampler2D u_texture;

    void main() {
      float distance = texture2D(u_texture, v_texcoord).r;
      float alpha = smoothstep(u_buffer - u_gamma, u_buffer + u_gamma, distance);
      gl_FragColor = vec4(u_color.rgb, alpha * u_color.a);
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');

  const colorUniform = gl.getUniformLocation(program, 'u_color');
  const matrixUniform = gl.getUniformLocation(program, 'u_matrix');
  const bufferUniform = gl.getUniformLocation(program, 'u_buffer');
  const gammaUniform = gl.getUniformLocation(program, 'u_gamma');

  if (
    colorUniform === null ||
    matrixUniform === null ||
    bufferUniform === null ||
    gammaUniform === null
  ) {
    throw new Error('Failed to create uniform');
  }

  return {
    program,
    positionLocation,
    texcoordLocation,
    colorUniform,
    matrixUniform,
    bufferUniform,
    gammaUniform,
  };
};

const prepareStringTriangles = (text: string) => {
  const vertices = [];

  let positionX = 0;
  for (let i = 0; i < text.length; i++) {
    const { x, y, width, height, lsb, rsb } = (spacing as any)[text[i]];
    const shape = boundingBoxToTriangles(
      positionX + (x + (i !== 0 ? lsb : 0)) * scale - buffer,
      48 - (y + height) * scale - buffer,
      width * scale + buffer * 2,
      height * scale + buffer * 2,
    );
    vertices.push(...shape);
    positionX += ((i !== 0 ? lsb : 0) + width + rsb) * scale;
  }

  const uvs = [];
  for (let i = 0; i < text.length; i++) {
    const maxWidth = font.width;
    const maxHeight = font.height;
    const { metadata } = font;
    const { x, y, width, height } = (metadata as any)[text[i]];
    const shape = boundingBoxToTriangles(
      (x * 2) / maxWidth,
      (y * 2) / maxHeight,
      (width * 2) / maxWidth,
      (height * 2) / maxHeight,
    );
    uvs.push(...shape);
  }

  return { vertices, uvs };
};

export const loadBuffers = async (gl: WebGLRenderingContext, text: string) => {
  const { vertices, uvs } = prepareStringTriangles(text);

  const positionBuffer = gl.createBuffer();

  if (positionBuffer === null) {
    throw new Error('Failed to created buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const textureBuffer = gl.createBuffer();
  if (textureBuffer === null) {
    throw new Error('Failed to created buffer');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const textureImage = await loadImage('/font.png');

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureImage,
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return {
    positionBuffer,
    textureBuffer,
    vertices,
  };
};
