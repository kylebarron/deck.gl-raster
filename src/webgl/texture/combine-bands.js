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

const fs = `\
uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_a;
`;

export default {
  name: 'combine-bands',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_CREATE_COLOR': `
    float r_band = texture2D(bitmapTexture_r, coord).r;
    float g_band = texture2D(bitmapTexture_g, coord).r;
    float b_band = texture2D(bitmapTexture_b, coord).r;
    float a_band = texture2D(bitmapTexture_a, coord).r;

    image = vec4(r_band, g_band, b_band, a_band);
    `,
  },
};
