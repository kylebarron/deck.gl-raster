export default `
#define SHADER_NAME bands-bitmap-layer-pan-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_pan;

varying vec2 vTexCoord;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;
uniform float panWeight;


// calculate pansharpen ratio
float pansharpen_ratio(vec3 rgb, float pan, float weight) {
    return pan / ((rgb.r + rgb.g + rgb.b * weight) / (2. + weight));
}

// Brovey Method: Each resampled, multispectral pixel is
// multiplied by the ratio of the corresponding
// panchromatic pixel intensity to the sum of all the
// multispectral intensities.
// Original code from https://github.com/mapbox/rio-pansharpen
vec3 pansharpen(vec3 rgb, float pan, float weight) {
    float ratio = pansharpen_ratio(rgb, pan, weight);
    vec3 alteredRGB = ratio * rgb;
    return clamp(alteredRGB, 0., 1.);
}

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  return mix(transparentColor, vec4(color, 1.0), alpha);
}

void main(void) {
  float r_band = texture2D(bitmapTexture_r, vTexCoord).r;
  float g_band = texture2D(bitmapTexture_g, vTexCoord).r;
  float b_band = texture2D(bitmapTexture_b, vTexCoord).r;
  float pan_band = texture2D(bitmapTexture_pan, vTexCoord).r;
  vec3 image = vec3(r_band, g_band, b_band);

  vec3 pansharpenedImage = pansharpen(image, pan_band, panWeight);

  gl_FragColor = apply_opacity(color_tint(color_desaturate(pansharpenedImage)), opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
