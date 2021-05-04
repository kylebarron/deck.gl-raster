import fs from './vector-length.fs.glsl';

export default {
  name: 'vector_length',
  fs,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = vec4(vector_length_calc(image), 0., 0., 0.);
    `,
  },
};
