import { terser } from "rollup-plugin-terser";

const config = (file, plugins = []) => ({
  input: "src/index.js",
  output: {
    name: "deck.gl-raster",
    format: "umd",
    indent: false,
    file,
  },
  plugins,
});

export default [
  config("dist/deck.gl-raster.js"),
  config("dist/deck.gl-raster.min.js", [terser()]),
];
