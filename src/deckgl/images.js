import {isWebGL2, Texture2D} from '@luma.gl/core';
import GL from '@luma.gl/constants';
import isEqual from 'lodash.isequal';

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
  [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

export function loadImages({gl, images, props, oldProps}) {
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
      images[key] = imageData.map((x) => loadTexture(gl, x));
    } else {
      images[key] = loadTexture(gl, imageData);
    }
    imagesDirty = true;
  }

  if (imagesDirty) {
    return images;
  }

  return null;
}

/**
 * Create Texture2D object from image data
 *
 * @param   {any}  gl gl context
 * @param   {Texture2D | Object} imageData input object representing image
 *
 * @return  {Texture2D?} Texture2D object representing image
 */
function loadTexture(gl, imageData) {
  if (!imageData) {
    return null;
  }

  if (imageData instanceof Texture2D) {
    return imageData;
  }

  let textureParams = {
    ...imageData,
    parameters: {
      ...DEFAULT_TEXTURE_PARAMETERS,
      ...imageData.parameters,
    },
  };

  if (!isWebGL2(gl)) {
    textureParams = webgl1TextureFallbacks(textureParams);
  }

  return new Texture2D(gl, textureParams);
}

/**
 * Texture fallbacks for WebGL1
 * Fallback ideas derived from viv
 * https://github.com/hms-dbmi/viv/blob/5bcec429eeba55914ef3d7155a610d82048520a0/src/layers/XRLayer/XRLayer.js#L280-L302
 *
 * @param   {Object}  textureParams  [textureParams description]
 *
 * @return  {Object}                 [return description]
 */
function webgl1TextureFallbacks(textureParams) {
  // Set mipmaps to false
  // Not sure if this is necessary?
  // Might actually only be necessary for uint textures
  textureParams.mipmaps = false;

  // Change format to Luminance
  if ([GL.R8UI, GL.R16UI, GL.R32UI].includes(textureParams.format)) {
    textureParams.format = GL.LUMINANCE;
  }

  // Change dataFormat to Luminance
  if (textureParams.dataFormat === GL.RED_INTEGER) {
    textureParams.dataFormat = GL.LUMINANCE;
  }

  // Set data type to float
  if (
    [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT, GL.UNSIGNED_INT].includes(
      textureParams.type
    )
  ) {
    textureParams.type = GL.FLOAT;
  }

  // Cast data to float 32 if one of the uint types
  if (
    textureParams.data instanceof Uint8Array ||
    textureParams.data instanceof Uint16Array ||
    textureParams.data instanceof Uint32Array
  ) {
    textureParams.data = new Float32Array(textureParams.data);
  }

  return textureParams;
}
