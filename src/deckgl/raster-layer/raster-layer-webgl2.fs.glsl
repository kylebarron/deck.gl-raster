#version 300 es
#define SHADER_NAME raster-layer-fragment-shader

// Ref https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf#page=60
precision mediump float;
precision mediump int;
precision mediump usampler2D;

in vec2 vTexCoord;

out vec4 color;

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
  vec4 image;
  DECKGL_CREATE_COLOR(image, vTexCoord);

  DECKGL_MUTATE_COLOR(image, vTexCoord);

  color = apply_opacity(color_tint(color_desaturate(image.rgb)), opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(color, geometry);
}
