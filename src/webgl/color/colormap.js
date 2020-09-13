import fs from './colormap.fs.glsl';

function getUniforms(opts = {}) {
  const {imageColormap} = opts;

  if (!imageColormap) {
    return;
  }

  return {
    bitmapTexture_colormap: imageColormap,
  };
}

export default {
  name: 'colormap',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = colormap_apply(bitmapTexture_colormap, image);
    `,
  },
};
