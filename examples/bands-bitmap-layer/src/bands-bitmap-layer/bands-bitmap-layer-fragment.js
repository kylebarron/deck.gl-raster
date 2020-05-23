export default `
#define SHADER_NAME bands-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_a;

varying vec2 vTexCoord;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;

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
  float a_band = texture2D(bitmapTexture_a, vTexCoord).r;

  vec4 image = vec4(r_band, g_band, b_band, a_band);

  MUTATE_COLOR(image, vTexCoord);

  gl_FragColor = apply_opacity(color_tint(color_desaturate(image.rgb)), opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
