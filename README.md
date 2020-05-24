# deck.gl-raster

deck.gl layers and WebGL modules for client-side satellite imagery processing

![](assets/images/msavi_grca_cfastie.jpg)

Landsat [Modified Soil Adjusted Vegetation Index][msavi] over the Grand Canyon and Kaibab Plateau, with the [`cfastie` colormap][cfastie].

[msavi]: https://www.usgs.gov/land-resources/nli/landsat/landsat-modified-soil-adjusted-vegetation-index
[cfastie]: assets/colormaps/cfastie.png

## Overview

[deck.gl](https://deck.gl) is a great geospatial rendering engine for the
browser. deck.gl layers are designed to be composable and easy to extend. As
such, small variations of the pre-built layers can do amazing new things, while
not being fit for inclusion in the standard layer library.

This repository is a handful of custom layers I've created for my own use, which
I've put into a single repository. **This repository is public for reference,
and should not be considered stable.**

## Install

```
yarn add @kylebarron/deck.gl-extended-layers
```

## Layers

### `BandsBitmapLayer`

This is a subclass of the `BitmapLayer` from the Deck.gl standard library to
enable image operations on individual satellite image bands. You can combine RGB
bands in true color or false color manners, or run a simple calculation and
apply a colormap. With true color imagery, you can optionally apply
pansharpening on the GPU. This layer allows for image bands to be requested and
loaded in parallel, which can sometimes speed up image loading.

#### Props

**Images**:

Images to render in the layer. All of these **must be passed to the class as `Texture2D` objects**.

- `image_r`: (`Texture2D`) Image corresponding to the red band.
- `image_g`: (`Texture2D`) Image corresponding to the green band.
- `image_b`: (`Texture2D`) Image corresponding to the blue band. Required when `band_combination` is `rgb` or `evi`.
- `image_pan`: (`Texture2D`) Optional. Image corresponding to the pansharpening band. Will be ignored if not provided or if `usePan` is `false`.
- `colormap`: (`Texture2D`) Required when `band_combination` is anything other than `rgb`. Not used when `band_combination` is `rgb`. Many colormaps are in `assets/colormaps` in PNG format, derived from Matplotlib and [`rio-tiler`][rio-tiler].

  To use them, you can use the jsdelivr CDN, e.g.:

  ```
  https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-extended-layers/assets/colormaps/{colormap_name}.png
  ```

  To visualize them, see [colormap documentation from rio-tiler][rio-tiler-colormap-docs].

[rio-tiler]: https://github.com/cogeotiff/rio-tiler
[rio-tiler-colormap-docs]: https://github.com/cogeotiff/rio-tiler/pull/176

**Band options**:

- `band_combination`: (`String`) Method of combining bands. Must be one of the following. Default is `rgb`. Any option other than `rgb` must provide a `colormap` texture.

  - `rgb`: Combines `image_r`, `image_g`, and `image_b` on the GPU in that order. If you pass red, green, and blue bands, a true color image will be rendered. You can alternatively pass other band combinations to create false color images.
  - `normalized_difference`: Computes the normalized difference of two bands: `(x - y) / (x + y)`. `normalized_difference` always uses `image_r` and `image_g` in that order (as `x` and `y`). It then applies the `colormap` texture to the output. Other bands are ignored.

    To create the [Normalized difference vegetation index
    (NDVI)][normalized_difference], for example, you would pass the
    near-infrared band as `image_r` and the red band as `image_g`.

  - `evi`: Computes the [Enhanced Vegetation Index (EVI)][evi]. Layers must be passed as **near-infrared, red, and blue** as `image_r`, `image_g` and `image_b`, respectively.
  - `savi`: Computes the [Soil Adjusted Vegetation Index (SAVI)][savi]. Layers must be passed as **near-infrared and red** as `image_r` and `image_g`, respectively.
  - `msavi`: Computes the [Modified Soil Adjusted Vegetation Index (MSAVI)][msavi]. Layers must be passed as **near-infrared and red** as `image_r` and `image_g`, respectively.

- `panWeight`: (`Number`). Weight of blue band when pansharpening. Default: `0.2`
- `usePan`: (`Boolean`) Optionally turn off pansharpening. Useful for false-color RGB combinations. This is automatically off for non-RGB band combinations. If `image_pan` is not provided, this is ignored.

[normalized_difference]: https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index
[evi]: https://www.usgs.gov/land-resources/nli/landsat/landsat-enhanced-vegetation-index-evi
[savi]: https://www.usgs.gov/land-resources/nli/landsat/landsat-soil-adjusted-vegetation-index-savi
[msavi]: https://www.usgs.gov/land-resources/nli/landsat/landsat-modified-soil-adjusted-vegetation-index-msavi

**`BitmapLayer` options**

These options are the same as the [normal deck.gl `BitmapLayer` options][bitmaplayer_props].

[bitmaplayer_props]: https://deck.gl/#/documentation/deckgl-api-reference/layers/bitmap-layer

- `bounds`
- `desaturate`
- `transparentColor`
- `tintColor`

### `BandsSimpleMeshLayer`

This is a subclass of the `SimpleMeshLayer` that accepts three or four separate
image bands (a fourth band is the panchromatic band, to sharpen other bands).
This is designed to have the benefits of the `BandsBitmapLayer` described above,
but used to render 3D terrain on a terrain mesh.

This layer is still undocumented and does not accept all the options described
above for the `BandsBitmapLayer`. Look at the `defaultProps` in the code to see
how to use this.
