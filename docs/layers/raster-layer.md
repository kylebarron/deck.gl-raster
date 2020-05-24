# `RasterLayer`


The `RasterLayer` is a subclass of deck.gl's built-in `BitmapLayer` that enables
image operations on satellite image bands. All image operations are done on the
GPU for best performance.

You can combine RGB bands in true color or false color manners, or create a
spectral index and apply a colormap. With true color imagery, you can apply
pansharpening from a panchromatic band. If an operation hasn't been implemented
yet, it's relatively easy to add your own operations.

## Props

#### `modules`

- `array`: default `[]`

#### `asyncModuleProps`

- `Object`: default `{}`

#### `moduleProps`

- `Object`: default `{}`


#### BitmapLayer Props

This layer inherits [all props][bitmaplayer_props] from the built-in deck.gl
`BitmapLayer`.


[bitmaplayer_props]: https://deck.gl/#/documentation/deckgl-api-reference/layers/bitmap-layer


