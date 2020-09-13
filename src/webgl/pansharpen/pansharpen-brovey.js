import fs from './pansharpen-brovey.fs.glsl';

function getUniforms(opts = {}) {
  const {imagePan, panWeight = 0.2} = opts;

  if (!imagePan) {
    return;
  }

  return {
    bitmapTexture_pan: imagePan,
    panWeight,
  };
}

export default {
  name: 'pansharpen_brovey',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = texture2D(bitmapTexture_pan, coord).r;
    image = pansharpen_brovey_calc(image, pan_band, panWeight);
    `,
  },
};
