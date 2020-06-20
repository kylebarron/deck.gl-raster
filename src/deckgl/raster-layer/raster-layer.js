import { BitmapLayer } from "@deck.gl/layers";
import { project32, picking } from "@deck.gl/core";

import fs from "./raster-layer-fragment";
import { ProgramManager } from "@luma.gl/engine";

const defaultProps = {
  ...BitmapLayer.defaultProps,
  modules: { type: "array", value: [], compare: true },
  asyncModuleProps: {
    type: "object",
    value: {},
    compare: true,
    async: true,
  },
  moduleProps: { type: "object", value: {}, compare: true },
};

export default class RasterLayer extends BitmapLayer {
  initializeState() {
    const { gl } = this.context;
    const programManager = ProgramManager.getDefaultProgramManager(gl);

    const fsStr1 = "fs:DECKGL_MUTATE_COLOR(inout vec4 image, in vec2 coord)";
    const fsStr2 = "fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)";

    // Only initialize shader hook functions _once globally_
    // Since the program manager is shared across all layers, but many layers
    // might be created, this solves the performance issue of always adding new
    // hook functions. See #22
    if (!programManager._hookFunctions.includes(fsStr1)) {
      programManager.addShaderHook(fsStr1);
    }
    if (!programManager._hookFunctions.includes(fsStr2)) {
      programManager.addShaderHook(fsStr2);
    }

    super.initializeState();
  }

  draw({ uniforms }) {
    const { model } = this.state;
    const {
      desaturate,
      transparentColor,
      tintColor,
      moduleProps,
      asyncModuleProps,
    } = this.props;

    // Render the image
    //
    // If asyncModuleProps has at least one key, wait for it to have >=1 truthy
    // key before rendering Important to prevent both flickering and "instanced
    // rendering of wrong data". Without this check, sometimes when panning to a
    // new area, new tiles will be a checkerboard of one existing tile while
    // waiting for the new textures to load.

    // NOTE this is broken because the default value is used while the tile is
    // loading
    if (
      !model ||
      (Object.keys(asyncModuleProps).length > 0 &&
        !Object.values(asyncModuleProps).every((item) => item))
    ) {
      return;
    }

    model
      .setUniforms(
        Object.assign({}, uniforms, {
          desaturate,
          transparentColor: transparentColor.map((x) => x / 255),
          tintColor: tintColor.slice(0, 3).map((x) => x / 255),
        })
      )
      .updateModuleSettings({ ...asyncModuleProps, ...moduleProps })
      .draw();
  }

  getShaders() {
    const { modules } = this.props;
    return {
      ...super.getShaders(),
      ...{
        fs,
        modules: [project32, picking, ...modules],
      },
    };
  }
}

RasterLayer.defaultProps = defaultProps;
RasterLayer.layerName = "RasterLayer";
