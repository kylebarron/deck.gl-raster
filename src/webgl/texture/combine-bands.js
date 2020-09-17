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

uniform usampler2D bitmapTexture_r;
uniform usampler2D bitmapTexture_g;
uniform usampler2D bitmapTexture_b;
uniform usampler2D bitmapTexture_a;
`;

export default {
  name: 'combine-bands',
  fs1,
  fs2,
  getUniforms,
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    float r_band = float(texture2D(bitmapTexture_r, coord).r);
    float g_band = float(texture2D(bitmapTexture_g, coord).r);
    float b_band = float(texture2D(bitmapTexture_b, coord).r);
    float a_band = float(texture2D(bitmapTexture_a, coord).r);

    image = vec4(r_band, g_band, b_band, a_band);
    `,
  },
};
