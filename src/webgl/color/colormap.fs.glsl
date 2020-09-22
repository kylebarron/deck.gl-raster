uniform sampler2D u_colormap_texture;

// Apply colormap texture given value
// Since the texture only varies in the x direction, setting v to 0.5 as a
// constant is fine
// Assumes the input range of value is -1 to 1
vec4 colormap(sampler2D cmap, vec4 image) {
  vec2 uv = vec2(0.5 * image.r + 0.5, 0.5);
  return texture2D(cmap, uv);
}
