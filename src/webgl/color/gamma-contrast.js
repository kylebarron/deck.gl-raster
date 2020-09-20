import fs from './gamma-contrast.fs.glsl';

function getUniforms(opts = {}) {
  const {gammaValue, gammaR, gammaG, gammaB, gammaA} = opts;

  if (!gammaValue || (!gammaR && !gammaG && !gammaB && !gammaA)) {
    return;
  }

  return {
    gamma_r: gammaR || 1,
    gamma_g: gammaG || 1,
    gamma_b: gammaB || 1,
    gamma_a: gammaA || 1,
  };
}

export default {
  name: 'gamma_contrast',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = gammaContrast(image, gamma_r, gamma_g, gamma_b, gamma_a);
    `,
  },
};
