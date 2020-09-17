import fs from './sigmoidal-contrast.fs.glsl';

function getUniforms(opts = {}) {
  const {sigmoidalContrast = 0, sigmoidalBias = 0.5} = opts;

  return {
    sigmoidal_contrast: sigmoidalContrast,
    sigmoidal_bias: sigmoidalBias
  };
}

export default {
  name: 'sigmoidal_contrast',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = sigmoidalContrast(image, sigmoidal_contrast, sigmoidal_bias);
    `,
  },
};
