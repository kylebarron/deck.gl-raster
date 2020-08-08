import { terser } from "rollup-plugin-terser";

const config = (file, plugins = []) => ({
  input: "src/index.js",
  output: {
    name: "deck.gl-raster",
    format: "umd",
    indent: false,
    file,
    globals: {
      "@deck.gl/core": "deck",
      "@deck.gl/layers": "deck",
      "@deck.gl/mesh-layers": "deck",
      "@luma.gl/core": "luma",
      "@luma.gl/constants": "luma",
      "@luma.gl/engine": "luma",
      "@luma.gl/webgl": "luma",
    },
  },
  plugins,
  external: [
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/mesh-layers",
    "@luma.gl/core",
    "@luma.gl/constants",
    "@luma.gl/engine",
    "@luma.gl/webgl",
  ],
});

export default [
  config("dist/deck.gl-raster.js"),
  config("dist/deck.gl-raster.min.js", [terser()]),
];
