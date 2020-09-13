import fs from './normalized-difference.fs.glsl';

export default {
  name: 'normalized_difference',
  fs,
  fs1: fs,
  fs2: fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(normalized_difference_calc(image), 0., 0., 0.);
    `,
  },
};
