const fs = `\
// Calculate standard normalized difference
float normalized_difference_calc(vec4 image) {
  return ((image.r - image.g) / (image.r + image.g));
}
`;

export default {
  name: "normalized_difference",
  fs,
  inject: {
    "fs:DECKGL_MUTATE_COLOR": `
    image = vec4(normalized_difference_calc(image), 0., 0., 0.);
    `,
  },
};
