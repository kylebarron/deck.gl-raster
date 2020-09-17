import fs from './evi.fs.glsl';

export default {
  name: 'enhanced_vegetation_index',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(enhanced_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
};
