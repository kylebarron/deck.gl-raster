import GL from "@luma.gl/constants";
import { BitmapLayer } from "@deck.gl/layers";
import { Model, Geometry, Texture2D } from "@luma.gl/core";
import { project32, picking } from "@deck.gl/core";

import fs from "./bands-bitmap-layer-fragment";
import pansharpen from "./pansharpen";
import {ProgramManager} from "@luma.gl/engine";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

const defaultProps = {
  image_r: { type: "object", value: null, async: true },
  image_g: { type: "object", value: null, async: true },
  image_b: { type: "object", value: null, async: true },
  image_pan: { type: "object", value: null, async: true },
  colormap: { type: "object", value: null, async: true },

  // Method of combining bands, one of:
  // "rgb", "normalized_difference", 'evi', 'savi', 'msavi'
  band_combination: "rgb",

  bounds: { type: "array", value: [1, 0, 0, 1], compare: true },
  desaturate: { type: "number", min: 0, max: 1, value: 0 },
  // Weight of blue band
  panWeight: { type: "number", min: 0, max: 1, value: 0.2 },
  // Optionally turn off pansharpening
  usePan: { type: "boolean", value: true },
  // More context: because of the blending mode we're using for ground imagery,
  // alpha is not effective when blending the bitmap layers with the base map.
  // Instead we need to manually dim/blend rgb values with a background color.
  transparentColor: { type: "color", value: [0, 0, 0, 0] },
  tintColor: { type: "color", value: [255, 255, 255] },
};

export default class BandsBitmapLayer extends BitmapLayer {
  draw(opts) {
    const { uniforms } = opts;
    // console.log(uniforms);
    const {
      bitmapTexture_r,
      bitmapTexture_g,
      bitmapTexture_b,
      bitmapTexture_pan,
      bitmapTexture_colormap,
      model,
    } = this.state;
    const {
      desaturate,
      transparentColor,
      tintColor,
      panWeight,
      band_combination,
    } = this.props;

    let usePan = false;
    let useNdvi = false;
    let useRgb = false;
    let useEvi = false;
    let useSavi = false;
    let useMsavi = false;

    switch (band_combination.toLowerCase()) {
      case "rgb":
        useRgb = true;
        usePan = Boolean(bitmapTexture_pan) && this.props.usePan;
        break;
      case "normalized_difference":
        useNdvi = true;
        break;
      case "evi":
        useEvi = true;
        break;
      case "savi":
        useSavi = true;
        break;
      case "msavi":
        useMsavi = true;
        break;
      default:
        console.error(`Invalid band_combination: ${band_combination}`);
    }

    // // TODO fix zFighting
    // Render the image
    if (bitmapTexture_r && bitmapTexture_g && model) {
      // console.log(model.getUniforms());

      model
        .setUniforms(
          Object.assign({}, uniforms, {
            // Textures
            bitmapTexture_r,
            bitmapTexture_g,
            bitmapTexture_b,
            bitmapTexture_colormap,

            // General image options
            desaturate,
            transparentColor: transparentColor.map((x) => x / 255),
            tintColor: tintColor.slice(0, 3).map((x) => x / 255),

            // Pan options, pan texture may or may not exist
            bitmapTexture_pan,
            panWeight,

            // Image operations
            usePan,
            useNdvi,
            useRgb,
            useEvi,
            useSavi,
            useMsavi,
          })
        )
        .draw();
      // console.log(model.getUniforms())
    }
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.bitmapTexture_r) {
      this.state.bitmapTexture_r.delete();
    }
    if (this.state.bitmapTexture_g) {
      this.state.bitmapTexture_g.delete();
    }
    if (this.state.bitmapTexture_b) {
      this.state.bitmapTexture_b.delete();
    }
    if (this.state.bitmapTexture_pan) {
      this.state.bitmapTexture_pan.delete();
    }
    if (this.state.bitmapTexture_colormap) {
      this.state.bitmapTexture_colormap.delete();
    }
  }

  getShaders() {
    // use object.assign to make sure we don't overwrite existing fields like `vs`, `modules`...
    return Object.assign({}, super.getShaders(), {
      fs,
      modules: [project32, picking, pansharpen],
      // hookFunctions: ["fs:MUTATE_COLOR(inout vec3 image)"],
    });
  }

  updateState({ props, oldProps, changeFlags }) {
    // setup model first
    if (changeFlags.extensionsChanged) {
      const { gl } = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({ model: this._getModel(gl) });
      this.getAttributeManager().invalidateAll();
    }

    if (props.image_r !== oldProps.image_r) {
      const bitmapTexture_r = this.loadTexture(props.image_r);
      if (this.state.bitmapTexture_r) {
        this.state.bitmapTexture_r.delete();
      }
      this.setState({ bitmapTexture_r });
    }
    if (props.image_g !== oldProps.image_g) {
      const bitmapTexture_g = this.loadTexture(props.image_g);
      if (this.state.bitmapTexture_g) {
        this.state.bitmapTexture_g.delete();
      }
      this.setState({ bitmapTexture_g });
    }
    if (props.image_b !== oldProps.image_b) {
      const bitmapTexture_b = this.loadTexture(props.image_b);
      if (this.state.bitmapTexture_b) {
        this.state.bitmapTexture_b.delete();
      }
      this.setState({ bitmapTexture_b });
    }
    if (props.image_pan !== oldProps.image_pan) {
      const bitmapTexture_pan = this.loadTexture(props.image_pan);
      if (this.state.bitmapTexture_pan) {
        this.state.bitmapTexture_pan.delete();
      }
      this.setState({ bitmapTexture_pan });
    }
    if (props.colormap !== oldProps.colormap) {
      const bitmapTexture_colormap = this.loadTexture(props.colormap);
      if (this.state.bitmapTexture_colormap) {
        this.state.bitmapTexture_colormap.delete();
      }
      this.setState({ bitmapTexture_colormap });
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      attributeManager.invalidate("positions");
    }
  }

  _getModel(gl) {
    if (!gl) {
      return null;
    }
    ProgramManager.getDefaultProgramManager(gl).addShaderHook(
      "fs:MUTATE_COLOR(inout vec3 image, in vec2 coord)"
    );

    /*
      0,0 --- 1,0
       |       |
      0,1 --- 1,1
    */
    const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: GL.TRIANGLE_FAN,
          vertexCount: 4,
          attributes: {
            texCoords: new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]),
          },
        }),
        isInstanced: false,
      })
    );
    // console.log(model.getUniforms())
    return model;
  }

  loadTexture(image) {
    const { gl } = this.context;

    if (image instanceof Texture2D) {
      return image;
    } else if (image instanceof HTMLVideoElement) {
      // Initialize an empty texture while we wait for the video to load
      return {
        bitmapTexture: new Texture2D(gl, {
          width: 1,
          height: 1,
          parameters: DEFAULT_TEXTURE_PARAMETERS,
          mipmaps: false,
        }),
      };
    } else if (image) {
      // Browser object: Image, ImageData, HTMLCanvasElement, ImageBitmap
      return {
        bitmapTexture: new Texture2D(gl, {
          data: image,
          parameters: DEFAULT_TEXTURE_PARAMETERS,
        }),
      };
    }
  }
}

BandsBitmapLayer.defaultProps = defaultProps;
BandsBitmapLayer.layerName = "BandsBitmapLayer";
