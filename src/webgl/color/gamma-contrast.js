import fs from './gamma-contrast.fs.glsl';

function getUniforms(opts = {}) {
  const {gammaValue = 1} = opts;

  return {
    gamma_value: gammaValue,
  };
}

export default {
  name: 'gamma_contrast',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = gammaContrast(image, gamma_value);
    `,
  },
};
