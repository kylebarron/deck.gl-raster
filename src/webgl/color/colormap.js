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
  fs1: fs,
  fs2: fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = colormap_apply(bitmapTexture_colormap, image);
    `,
  },
};
