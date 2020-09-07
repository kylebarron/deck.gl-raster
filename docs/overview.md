# Overview

This page provides a high-level overview of the goals of `deck.gl-raster`, how
it works, and provides context for the rest of the documentation.

Currently, this package emphasizes working with satellite imagery. I hope to include support for elevation bitmaps in the future.

## Why client-side rasters?

Client side rendering of vector geometries has seen huge progress in recent
years, largely driven by Mapbox. Yet existing support for client-side _raster_
rendering in web maps is lacking for a few reasons:

- **No mass-market appeal.** A fast basemap is relevant to many consumers for navigation purposes, and thus receives corporate investments. Most consumers care only about true-color satellite imagery, which doesn't need any special client-side effort.
- **Larger data sizes.** Since vector geometries are "sparse", they tend to be smaller than rasters. Even when using lossy JPEG compression, I find a three-band 256x256 tile to be around 75KB.

So why care? I believe client-side rendering brings huge potential to
**_analytic_** uses of satellite imagery. Client-side rendering prevents
excessive round-trips to a server, but operations are still fast because the GPU
is efficient at image processing.

## Serving Imagery

`deck.gl-raster` is premised upon being able to fetch tiled raster data in
analytic form. For satellite imagery, this means the ability to access arbitrary
satellite bands, and is most efficient when bands are requested individually
from the server.

For these reasons, `deck.gl-raster` pairs well with tile servers that read from
collections of [Cloud-Optimized GeoTIFF (COG)](https://cogeo.org) imagery, the
included [examples](examples/raster-layer-md.md) and the larger
[landsat8.earth](https://landsat8.earth) application connect to [a
backend][landsat-mosaic-tiler] serving imagery from the AWS collection of
Landsat 8 imagery in COG format.

[landsat-mosaic-tiler]: https://github.com/kylebarron/landsat-mosaic-tiler

## Drawbacks

- Only 8-bit images/textures are currently supported. I'd love to support 16-bit images in the future, but the GPU code to support them is difficult.
