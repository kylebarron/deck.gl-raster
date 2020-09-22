import fs from './colormap.fs.glsl';

function getUniforms(opts = {}) {
  const {imageColormap} = opts;

  if (!imageColormap) {
    return;
  }

  return {
    u_colormap_texture: imageColormap,
  };
}

export default {
  name: 'colormap',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = colormap(u_colormap_texture, image);
    `,
  },
};
