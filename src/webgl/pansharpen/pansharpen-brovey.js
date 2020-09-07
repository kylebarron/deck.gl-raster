function getUniforms(opts = {}) {
  const {imagePan, panWeight = 0.2} = opts;

  if (!imagePan) {
    return;
  }

  return {
    bitmapTexture_pan: imagePan,
    panWeight,
  };
}

// Brovey Method: Each resampled, multispectral pixel is
// multiplied by the ratio of the corresponding
// panchromatic pixel intensity to the sum of all the
// multispectral intensities.
// Original code from https://github.com/mapbox/rio-pansharpen
const fs = `\
uniform sampler2D bitmapTexture_pan;
uniform float panWeight;

float pansharpen_brovey_ratio(vec4 rgb, float pan, float weight) {
    return pan / ((rgb.r + rgb.g + rgb.b * weight) / (2. + weight));
}

vec4 pansharpen_brovey_calc(vec4 rgb, float pan, float weight) {
    float ratio = pansharpen_brovey_ratio(rgb, pan, weight);
    vec4 alteredRGB = ratio * rgb;
    return clamp(alteredRGB, 0., 1.);
}
`;

export default {
  name: 'pansharpen_brovey',
  fs,
  getUniforms,
  inject: {
    'fs:DECKGL_MUTATE_COLOR': `
    float pan_band = texture2D(bitmapTexture_pan, coord).r;
    image = pansharpen_brovey_calc(image, pan_band, panWeight);
    `,
  },
};
