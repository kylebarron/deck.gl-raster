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
precision mediump float;
precision mediump int;
precision mediump usampler2D;

#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_rgba;
#else
  uniform sampler2D bitmapTexture_rgba;
#endif
`;

export default {
  name: 'rgba-image',
  fs1,
  fs2,
  getUniforms,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    image = float(texture2D(bitmapTexture_rgba, coord));
    `,
  },
};
