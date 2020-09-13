import fs from './savi.fs.glsl';

export default {
  name: 'soil_adjusted_vegetation_index',
  fs,
  fs1: fs,
  fs2: fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(soil_adjusted_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
};
