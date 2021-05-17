import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
import glsl from 'rollup-plugin-glsl';

const config = (file, plugins = []) => ({
  input: 'src/index.js',
  output: {
    name: 'deck.gl-raster',
    format: 'umd',
    indent: false,
    file,
    globals: {
      '@deck.gl/core': 'deck',
      '@deck.gl/layers': 'deck',
      '@deck.gl/mesh-layers': 'deck',
      '@luma.gl/core': 'luma',
      '@luma.gl/constants': 'luma.GL',
      '@luma.gl/engine': 'luma',
      '@luma.gl/webgl': 'luma',
    },
  },
  plugins: [
    resolve(),
    commonjs(),
    ...plugins,
    glsl({
      include: 'src/**/*.glsl',
      sourceMap: true,
      compress: true
    }),
  ],
  external: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/mesh-layers',
    '@luma.gl/core',
    '@luma.gl/constants',
    '@luma.gl/engine',
    '@luma.gl/webgl',
  ],
});

export default [
  config('dist/dist.js'),
  config('dist/dist.min.js', [terser()]),
];
