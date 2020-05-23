const fs = `\
// Calculate standard normalized difference
float normalized_difference_calc(vec3 image) {
  return ((image.r - image.g) / (image.r + image.g));
}
`;

export default {
  name: "normalized_difference",
  fs,
  inject: {
    "fs:MUTATE_COLOR": `
    image = vec3(normalized_difference_calc(image), 0., 0.);
    `,
  },
};
