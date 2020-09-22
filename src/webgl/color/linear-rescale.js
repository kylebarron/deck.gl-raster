import fs from './linear-rescale.fs.glsl';

function getUniforms(opts = {}) {
  const {linearRescaleScaler, linearRescaleOffset} = opts;

  if (!linearRescaleScaler && !linearRescaleOffset) {
    return;
  }

  return {
    linearRescaleScaler: linearRescaleScaler || 1,
    linearRescaleOffset: linearRescaleOffset || 0,
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
