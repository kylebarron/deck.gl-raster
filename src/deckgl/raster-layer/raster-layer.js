import { BitmapLayer } from "@deck.gl/layers";
import { project32, picking } from "@deck.gl/core";
import { Texture2D } from "@luma.gl/core";
import { ProgramManager } from "@luma.gl/engine";
import GL from "@luma.gl/constants";
import isEqual from "lodash.isequal";

import fs from "./raster-layer-fragment";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

const defaultProps = {
  ...BitmapLayer.defaultProps,
  modules: { type: "array", value: [], compare: true },
  images: { type: "object", value: {}, compare: true },
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

    // images is a mapping from keys to Texture2D objects. The keys should match
    // names of uniforms in shader modules
    this.setState({ images: {} });

    super.initializeState();
  }

  draw({ uniforms }) {
    const { model, images } = this.state;
    const { desaturate, transparentColor, tintColor, moduleProps } = this.props;

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
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
      .updateModuleSettings({
        ...moduleProps,
        ...images,
      })
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

    if (props && props.images) {
      this.updateImages({ props, oldProps });
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      const oldMesh = this.state.mesh;
      const mesh = this._createMesh();
      this.state.model.setVertexCount(mesh.vertexCount);
      for (const key in mesh) {
        if (oldMesh && oldMesh[key] !== mesh[key]) {
          attributeManager.invalidate(key);
        }
      }
      this.setState({ mesh });
    }
  }

  updateImages({ props, oldProps }) {
    const { images } = this.state;

    // Change to `true` if we need to setState with a new `images` object
    let imagesDirty = false;

    // If there are any removed keys, which previously existed in oldProps and
    // this.state.images but no longer exist in props, remove from the images
    // object
    if (oldProps && oldProps.images) {
      for (const key in oldProps.images) {
        if (props.images && !(key in props.images) && key in images) {
          delete images[key];
          imagesDirty = true;
        }
      }
    }

    // Check if any keys of props.images have changed
    const changedKeys = [];
    for (const key in props.images) {
      // If oldProps.images didn't exist or it existed and this key didn't exist
      if (!oldProps.images || (oldProps.images && !(key in oldProps.images))) {
        changedKeys.push(key);
        continue;
      }

      // Deep compare when the key previously existed to see if it changed
      if (!isEqual(props.images[key], oldProps.images[key])) {
        changedKeys.push(key);
      }
    }

    for (const key of changedKeys) {
      const imageData = props.images[key];
      if (!imageData) {
        continue;
      }

      if (Array.isArray(imageData)) {
        images[key] = imageData.map((x) => this.loadTexture(x));
      } else {
        images[key] = this.loadTexture(imageData);
      }
      imagesDirty = true;
    }

    if (imagesDirty) {
      this.setState({ images });
    }
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.images) {
      for (const image of Object.values(this.state.images)) {
        if (Array.isArray(image)) {
          image.map((x) => x.delete());
        } else {
          image.delete();
        }
      }
    }
  }

  loadTexture(imageData) {
    const { gl } = this.context;

    if (imageData instanceof Texture2D) {
      return imageData;
    } else if (imageData) {
      return new Texture2D(gl, {
        parameters: DEFAULT_TEXTURE_PARAMETERS,
        ...imageData,
      });
    }
  }
}

RasterLayer.defaultProps = defaultProps;
RasterLayer.layerName = "RasterLayer";
