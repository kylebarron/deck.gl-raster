precision mediump usampler2D;

#ifdef SAMPLER_TYPE
  uniform SAMPLER_TYPE bitmapTexture_pan;
#else
  uniform sampler2D bitmapTexture_pan;
#endif

uniform float panWeight;

float pansharpen_brovey_ratio(vec4 rgb, float pan, float weight) {
  return pan / ((rgb.r + rgb.g + rgb.b * weight) / (2. + weight));
}

// Brovey Method: Each resampled, multispectral pixel is
// multiplied by the ratio of the corresponding
// panchromatic pixel intensity to the sum of all the
// multispectral intensities.
// Original code from https://github.com/mapbox/rio-pansharpen
//
// NOTE: I originally clamped the output to the 0-1 range. Clamping was removed
// to support 16 bit-depth textures
vec4 pansharpen_brovey_calc(vec4 rgb, float pan, float weight) {
  float ratio = pansharpen_brovey_ratio(rgb, pan, weight);
  return ratio * rgb;
}
