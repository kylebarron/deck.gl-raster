// Calculate standard normalized difference
float normalized_difference_calc(vec4 image) {
  return ((image.r - image.g) / (image.r + image.g));
}
