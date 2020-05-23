// Can't figure this out, it overwrites uniforms with null
function getUniforms(opts = {}) {
  const { image_pan, panWeight = 0 } = opts;
  return {
    bitmapTexture_pan: image_pan,
    panWeight,
  };
}

const fs = `\
uniform sampler2D bitmapTexture_pan;
uniform float panWeight;

// calculate pansharpen ratio
float pansharpen_brovey_ratio(vec4 rgb, float pan, float weight) {
    return pan / ((rgb.r + rgb.g + rgb.b * weight) / (2. + weight));
}

// Brovey Method: Each resampled, multispectral pixel is
// multiplied by the ratio of the corresponding
// panchromatic pixel intensity to the sum of all the
// multispectral intensities.
// Original code from https://github.com/mapbox/rio-pansharpen
vec4 pansharpen_brovey(vec4 rgb, float pan, float weight) {
    float ratio = pansharpen_brovey_ratio(rgb, pan, weight);
    vec4 alteredRGB = ratio * rgb;
    return clamp(alteredRGB, 0., 1.);
}
`;

export default {
  name: "pansharpen",
  fs,
  // getUniforms,
  inject: {
    "fs:MUTATE_COLOR": `
    float pan_band = texture2D(bitmapTexture_pan, coord).r;
    image = pansharpen_brovey(image, pan_band, panWeight);
    `,
  },
};
