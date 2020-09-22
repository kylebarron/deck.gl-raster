import fs1 from './pansharpen-brovey-webgl1.fs.glsl';
import fs2 from './pansharpen-brovey-webgl2.fs.glsl';

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
  fs1,
  fs2,
  defines: {
    SAMPLER_TYPE: 'sampler2D',
  },
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = float(texture2D(bitmapTexture_pan, coord).r);
    image = pansharpen_brovey_calc(image, pan_band, panWeight);
    `,
  },
};
