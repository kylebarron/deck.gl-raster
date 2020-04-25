import { terser } from "rollup-plugin-terser";

const config = (file, plugins = []) => ({
  input: "src/index.js",
  output: {
    name: "deck.gl-extended-layers",
    format: "umd",
    indent: false,
    file,
  },
  plugins,
});

export default [
  config("dist/deck.gl-extended-layers.js"),
  config("dist/deck.gl-extended-layers.min.js", [terser()]),
];
