import fs from './colormap.fs.glsl';

function getUniforms(opts = {}) {
  const {imageColormap, colormapScaler, colormapOffset} = opts;

  if (!imageColormap) {
    return;
  }

  return {
    u_colormap_texture: imageColormap,
    colormapScaler: Number.isFinite(colormapScaler) ? colormapScaler : 0.5,
    colormapOffset: Number.isFinite(colormapOffset) ? colormapOffset : 0.5,
  };
}

export default {
  name: 'colormap',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    image = colormap(u_colormap_texture, image, colormapScaler, colormapOffset);
    `,
  },
};
