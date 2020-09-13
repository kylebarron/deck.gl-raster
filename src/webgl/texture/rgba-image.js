function getUniforms(opts = {}) {
  const {imageRgba} = opts;
  if (!imageRgba) {
    return;
  }

  return {
    bitmapTexture_rgba: imageRgba,
  };
}

const fs1 = `\
uniform sampler2D bitmapTexture_rgba;
`;

const fs2 = `\
precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D bitmapTexture_rgba;
`;

export default {
  name: 'rgba-image',
  fs1,
  fs2,
  getUniforms,
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    image = texture2D(bitmapTexture_rgba, coord);
    `,
  },
};
