function getUniforms(opts = {}) {
  const { image_colormap } = opts;

  if (!image_colormap) {
    return;
  }

  return {
    bitmapTexture_colormap: image_colormap,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_colormap;

// Apply colormap texture given value
// Since the texture only varies in the x direction, setting v to 0.5 as a
// constant is fine
// Assumes the input range of value is -1 to 1
vec4 colormap_apply(sampler2D colormap, vec4 image) {
  vec2 uv = vec2(0.5 * image.r + 0.5, 0.5);
  return texture2D(colormap, uv);
}
`;

export default {
  name: "colormap",
  fs,
  getUniforms,
  inject: {
    "fs:DECKGL_MUTATE_COLOR": `
    image = colormap_apply(bitmapTexture_colormap, image);
    `,
  },
};
