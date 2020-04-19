import React from "react";
import DeckGL from "@deck.gl/react";

import { PostProcessEffect } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";

import { StaticMap } from "react-map-gl";

import {
  BandsBitmapLayer,
  PanBandsBitmapLayer,
} from "@kylebarron/bands-bitmap-layer";

import { loadImageArray } from "@loaders.gl/images";

import { vibrance } from "@luma.gl/shadertools";
import { Texture2D } from "@luma.gl/core";
import GL from "@luma.gl/constants";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

const initialViewState = {
  longitude: -112.1861,
  latitude: 36.1284,
  zoom: 12.1,
  pitch: 0,
  bearing: 0,
};

const vibranceEffect = new PostProcessEffect(vibrance, {
  amount: 1,
});

export default class App extends React.Component {
  state = {
    gl: null,
  };

  render() {
    const layers = [
      new TileLayer({
        data:
          "https://landsat-lambda.kylebarron.dev/tiles/229bc0ed88ac7f39effdb554efa0959766e41bb3948754faba13f74f/{z}/{x}/{y}@2x.jpg?bands=&color_ops=gamma+R+3.5%2C+sigmoidal+R+15+0.35",

        minZoom: 0,
        maxZoom: 12,

        getTileData: async ({ url, z }) => {
          const { gl } = this.state;
          const pan = z >= 12;

          const urls = [
            url.replace("bands=", "bands=4"),
            url.replace("bands=", "bands=3"),
            url.replace("bands=", "bands=2"),
          ];
          if (pan) {
            urls.push(url.replace("bands=", "bands=8"));
          }
          const images = await loadImageArray(
            urls.length,
            ({ index }) => urls[index]
          );

          const textures = images.map((image) => {
            return new Texture2D(gl, {
              data: image,
              parameters: DEFAULT_TEXTURE_PARAMETERS,
              format: GL.RGB,
            });
          });
          return textures;
        },

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
            z,
          } = props.tile;
          const { data } = props;
          const pan = z >= 12;

          let image_r, image_g, image_b, image_pan;
          if (Array.isArray(data)) {
            image_r = data[0];
            image_g = data[1];
            image_b = data[2];
            if (pan) {
              image_pan = data[3];
            }
          } else if (data) {
            image_r = data.then((result) => result && result[0]);
            image_g = data.then((result) => result && result[1]);
            image_b = data.then((result) => result && result[2]);
            if (pan) {
              image_pan = data.then((result) => result && result[3]);
            }
          }

          if (pan) {
            return new PanBandsBitmapLayer(props, {
              data: null,
              image_r,
              image_g,
              image_b,
              image_pan,
              bounds: [west, south, east, north],
            });
          }

          return new BandsBitmapLayer(props, {
            data: null,
            image_r,
            image_g,
            image_b,
            bounds: [west, south, east, north],
          });
        },
      }),
    ];

    return (
      <DeckGL
        onWebGLInitialized={(gl) => this.setState({ gl })}
        initialViewState={initialViewState}
        layers={layers}
        effects={[vibranceEffect]}
        controller
      >
        <StaticMap
          mapStyle="https://cdn.jsdelivr.net/gh/nst-guide/osm-liberty-topo@gh-pages/style.json"
          mapOptions={{ hash: true }}
        />
      </DeckGL>
    );
  }
}
