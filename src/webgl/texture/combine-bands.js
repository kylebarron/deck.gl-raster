function getUniforms(opts = {}) {
  const {imageBands} = opts;
  if (!imageBands || imageBands.length === 0) {
    return;
  }

  const [
    bitmapTexture_r,
    bitmapTexture_g,
    bitmapTexture_b,
    bitmapTexture_a,
  ] = imageBands;

  return {
    bitmapTexture_r,
    bitmapTexture_g,
    bitmapTexture_b,
    bitmapTexture_a,
  };
}

const fs1 = `\
uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_a;
`;

const fs2 = `\
precision mediump float;
precision mediump int;
precision mediump usampler2D;

#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_r;
  uniform SAMPLER_TYPE bitmapTexture_g;
  uniform SAMPLER_TYPE bitmapTexture_b;
  uniform SAMPLER_TYPE bitmapTexture_a;
#else
  uniform sampler2D bitmapTexture_r;
  uniform sampler2D bitmapTexture_g;
  uniform sampler2D bitmapTexture_b;
  uniform sampler2D bitmapTexture_a;
#endif
`;

export default {
  name: 'combine-bands',
  fs1,
  fs2,
  getUniforms,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    float channel1 = float(texture2D(bitmapTexture_r, coord).r);
    float channel2 = float(texture2D(bitmapTexture_g, coord).r);
    float channel3 = float(texture2D(bitmapTexture_b, coord).r);
    float channel4 = float(texture2D(bitmapTexture_a, coord).r);

    image = vec4(channel1, channel2, channel3, channel4);
    `,
  },
};
