# Color operations

Modules to perform color operations on an existing image.

## `colormap`

Apply a colormap onto a grayscale image.

This is expected to be passed after creating a spectral index, which transforms
the image bands into an index ranging from -1 to 1. Applying a colormap enables
better visualization of this range of data.

### Props

#### `imageColormap`

- `Texture2D`, required

A [`Texture2D`][texture2d] instance representing a colormap.

**Note**: make sure you create this texture in the `GL.RGB` mode; otherwise the
colormap will map the source grayscale image to a different grayscale image.

A colormap is expected to start as a two-dimensional image that gradually
changes color horizontally through the image. The left side of the image is
expected to correspond to -1, and the right is expected to correspond to 1.

A collection of colormaps is hosted in the `deck.gl-raster` repository, but any
image can be used as the colormap. The color value will be chosen horizontally.
For example, for a value of `0`, the middle pixel value, horizontally, of the
image will be chosen.

Many colormaps are in `assets/colormaps` in PNG format, derived from Matplotlib and [`rio-tiler`][rio-tiler].

To use them, you can use the jsdelivr CDN, e.g.:

```
https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/{colormap_name}.png
```

To visualize them, see [colormap documentation from rio-tiler][rio-tiler-colormap-docs].

[rio-tiler]: https://github.com/cogeotiff/rio-tiler
[rio-tiler-colormap-docs]: https://github.com/cogeotiff/rio-tiler/pull/176
[texture2d]: https://luma.gl/docs/api-reference/webgl/texture-2d
