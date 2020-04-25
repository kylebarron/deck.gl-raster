# deck.gl-extended-layers

A collection of custom Deck.gl layers

## Overview

[Deck.gl](https://deck.gl) is a great geospatial rendering engine for the
browser. Deck.gl layers are designed to be composable and easy to extend. As
such, small variations of the pre-built layers can do amazing new things, while
not being fit for inclusion in the standard layer library.

This repository is a handful of custom layers I've created for my own use, which
I've put into a single repository.

## Install

```
yarn add @kylebarron/deck.gl-extended-layers
```

## Layers

- `BandsBitmapLayer`: a subclass of the `BitmapLayer` from the Deck.gl standard library that accepts three separate image bands, which are combined on the GPU. This both:
  -  allows the bands to be retrieved in parallel, which can sometimes speed up image loading
  -  allows for arbitrary band combinations.
- `PanBandsBitmapLayer`: same as above but accepts a fourth texture, the panchromatic satellite band to sharpen the other three. At some point will be merged into the `BandsBitmapLayer`.
- `BandsSimpleMeshLayer`: a subclass of the `SimpleMeshLayer` that accepts three or four separate image bands (a fourth band is the panchromatic band, to sharpen other bands). This is designed to have the benefits of the `BandsBitmapLayer` described above, but used to render 3D terrain on a terrain mesh.

For now, these layers are somewhat undocumented. Look at the `defaultProps` in the code to see how to use them.
