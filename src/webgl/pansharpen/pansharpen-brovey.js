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

// TODO: update pansharpening texture to support usampler
export default {
  name: 'pansharpen_brovey',
  fs,
  fs1: fs,
  fs2: fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = texture2D(bitmapTexture_pan, coord).r;
    image = pansharpen_brovey_calc(image, pan_band, panWeight);
    `,
  },
};
