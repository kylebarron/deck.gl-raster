function getUniforms(opts = {}) {
  const { imageRgba } = opts;
  if (!imageRgba) {
    return;
  }

  return {
    bitmapTexture_rgba: imageRgba,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_rgba;
`;

export default {
  name: "rgba-image",
  fs,
  getUniforms,
  inject: {
    "fs:DECKGL_CREATE_COLOR": `
    image = texture2D(bitmapTexture_rgba, coord);
    `,
  },
};
