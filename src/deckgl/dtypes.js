import GL from '@luma.gl/constants';

// Originally ported from viv
// https://github.com/hms-dbmi/viv/blob/603e5e0967eec1b360623dbe51357baa6bdf71fc/src/constants.js#L12-L43
export const WEBGL2_DTYPES = {
  uint8: {
    format: GL.R8UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_BYTE,
  },
  uint16: {
    format: GL.R16UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_SHORT,
  },
  uint32: {
    format: GL.R32UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_INT,
  },
  int8: {
    format: GL.R8I,
    dataFormat: GL.RED_INTEGER,
    type: GL.BYTE,
  },
  int16: {
    format: GL.R16I,
    dataFormat: GL.RED_INTEGER,
    type: GL.SHORT,
  },
  int32: {
    format: GL.R32I,
    dataFormat: GL.RED_INTEGER,
    type: GL.INT,
  },
  float16: {
    format: GL.R16F,
    dataFormat: GL.RED,
    type: GL.HALF_FLOAT,
  },
  float32: {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
  },
};
