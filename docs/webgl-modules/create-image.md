# Create Image

## `combineBands`

Combine satellite image bands into one image for display or further processing.

### Props

#### `imageBands`

- `Array of Texture2D`, required

An array of [`Texture2D`][texture2d] objects representing the bands to combine
into a single image.

To create a true-color image, you would pass the red, green, and blue image
bands to the `imageBands` prop. To create a false-color image, you would pass
image bands in the desired order to the `imageBands` prop. For example, for a
false-color agriculture image with Landsat 8 data, you would pass textures
corresponding to bands 6, 5, and 2, in that order to the `imageBands` prop.

Alternatively, `combineBands` can be used to assemble bands into an image for
further processing, for example to create a spectral index. The [spectral
indices docs](spectral-indices.md) define which bands must be passed in which
order.

Note that between 1 and 4 images may be passed to `imageBands`. If you only want
to apply a colormap onto a grayscale image, you might pass a single image
texture. If you want to calculate NDVI, you need only pass two image textures.
To create a true-color image you'd need three. The current maximum number of
imageBands is 4.

[texture2d]: https://luma.gl/docs/api-reference/webgl/texture-2d
