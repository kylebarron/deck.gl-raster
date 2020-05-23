import GL from "@luma.gl/constants";
import { BitmapLayer } from "@deck.gl/layers";
import { Model, Geometry } from "@luma.gl/core";
import { project32, picking } from "@deck.gl/core";

import fs from "./bands-bitmap-layer-fragment";
import { ProgramManager } from "@luma.gl/engine";

const defaultProps = {
  modules: { type: "array", value: [], compare: true },
  asyncModuleUniforms: {
    type: "object",
    value: {},
    compare: true,
    async: true,
  },
  moduleUniforms: { type: "object", value: {}, compare: true },

  bounds: { type: "array", value: [1, 0, 0, 1], compare: true },
  desaturate: { type: "number", min: 0, max: 1, value: 0 },
  // More context: because of the blending mode we're using for ground imagery,
  // alpha is not effective when blending the bitmap layers with the base map.
  // Instead we need to manually dim/blend rgb values with a background color.
  transparentColor: { type: "color", value: [0, 0, 0, 0] },
  tintColor: { type: "color", value: [255, 255, 255] },
};

export default class BandsBitmapLayer extends BitmapLayer {
  draw(opts) {
    const { uniforms } = opts;
    const { model } = this.state;
    const {
      desaturate,
      transparentColor,
      tintColor,
      moduleUniforms,
      asyncModuleUniforms,
    } = this.props;

    // // TODO fix zFighting
    // Render the image
    // Wait for asyncModuleUniforms to have >=1 truthy key before rendering
    // Important to prevent both flickering and "instanced rendering of wrong
    // data". Without this check, sometimes when panning to a new area, new
    // tiles will be a checkerboard of one existing tile while waiting for the
    // new textures to load.
    if (
      model &&
      Object.keys(asyncModuleUniforms).length !== 0 &&
      Object.values(asyncModuleUniforms).every((item) => item)
    ) {
      model
        .setUniforms(
          Object.assign({}, uniforms, {
            desaturate,
            transparentColor: transparentColor.map((x) => x / 255),
            tintColor: tintColor.slice(0, 3).map((x) => x / 255),
          })
        )
        .updateModuleSettings({ ...asyncModuleUniforms, ...moduleUniforms })
        .draw();
    }
  }

  getShaders() {
    const { modules } = this.props;
    return Object.assign({}, super.getShaders(), {
      fs,
      modules: [project32, picking, ...modules],
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
      "fs:MUTATE_COLOR(inout vec4 image, in vec2 coord)"
    );

    ProgramManager.getDefaultProgramManager(gl).addShaderHook(
      "fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)"
    );

    /*
      0,0 --- 1,0
       |       |
      0,1 --- 1,1
    */
    return new Model(
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
  }
}

BandsBitmapLayer.defaultProps = defaultProps;
BandsBitmapLayer.layerName = "BandsBitmapLayer";
