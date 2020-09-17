import fs from './gamma-contrast.fs.glsl';

function getUniforms(opts = {}) {
  const {gammaR = 1, gammaG = 1, gammaB = 1, gammaA = 1} = opts;

  return {
    gamma_r: gammaR,
    gamma_g: gammaG,
    gamma_b: gammaB,
    gamma_a: gammaA,
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
