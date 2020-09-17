import fs from './linear-rescale.fs.glsl';

function getUniforms(opts = {}) {
  const {linearRescaleScaler = 1, linearRescaleOffset = 0} = opts;

  return {
    linearRescaleScaler,
    linearRescaleOffset,
  };
}

export default {
  name: 'linear_rescale',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = linear_rescale(image, linearRescaleScaler, linearRescaleOffset);
    `,
  },
};
