// NOTE: this should be considered an experimental export for now

// \x93NUMPY
const NPY_MAGIC = new Uint8Array([147, 78, 85, 77, 80, 89]);

function systemIsLittleEndian() {
  const a = new Uint32Array([0x12345678]);
  const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  return !(b[0] == 0x12);
}

const LITTLE_ENDIAN_OS = systemIsLittleEndian();

// The basic string format consists of 3 parts:
// - a character describing the byteorder of the data (<: little-endian, >: big-endian, |: not-relevant)
// - a character code giving the basic type of the array
// - an integer providing the number of bytes the type uses.
// https://numpy.org/doc/stable/reference/arrays.interface.html
const DTYPES = {
  u1: {
    name: 'uint8',
    arrayConstructor: Uint8Array,
  },
  i1: {
    name: 'int8',
    arrayConstructor: Int8Array,
  },
  u2: {
    name: 'uint16',
    arrayConstructor: Uint16Array,
  },
  i2: {
    name: 'int16',
    arrayConstructor: Int16Array,
  },
  u4: {
    name: 'uint32',
    arrayConstructor: Int32Array,
  },
  i4: {
    name: 'int32',
    arrayConstructor: Int32Array,
  },
  f4: {
    name: 'float32',
    arrayConstructor: Float32Array,
  },
  f8: {
    name: 'float64',
    arrayConstructor: Float64Array,
  },
};

export function parseNpy(arrayBuffer) {
  if (!arrayBuffer) {
    return null;
  }

  const view = new DataView(arrayBuffer);

  const magic = new Uint8Array(arrayBuffer, 0, 6);
  if (!arrayEqual(magic, NPY_MAGIC)) {
    console.warn('NPY Magic not matched!');
  }

  const majorVersion = view.getUint8(6);
  // const minorVersion = view.getUint8(7);

  let offset = 8;
  let headerLength;
  if (majorVersion >= 2) {
    headerLength = view.getUint32(8, true);
    offset += 4;
  } else {
    headerLength = view.getUint16(8, true);
    offset += 2;
  }

  const encoding = majorVersion <= 2 ? 'latin1' : 'utf-8';
  const decoder = new TextDecoder(encoding);
  const headerArray = new Uint8Array(arrayBuffer, offset, headerLength);
  const headerText = decoder.decode(headerArray);
  offset += headerLength;

  const header = JSON.parse(
    headerText
      .replace(/'/g, '"')
      .replace('False', 'false')
      .replace('(', '[')
      .replace(/,*\),*/g, ']')
  );

  const npy_dtype = header.descr;
  const dtype = DTYPES[npy_dtype.slice(1, 3)];
  if (!dtype) {
    console.warn(`Decoding of npy dtype not implemented: ${npy_dtype}`);
    return null;
  }

  const data = new dtype['arrayConstructor'](arrayBuffer, offset);

  // Swap endianness if needed
  if (
    (npy_dtype[0] === '>' && LITTLE_ENDIAN_OS) ||
    (npy_dtype[0] === '<' && !LITTLE_ENDIAN_OS)
  ) {
    throw new Error(
      'Data is wrong endianness, byte swapping not yet implemented.'
    );
  }

  if (header && header.fortran_order) {
    console.warn('Data is in Fortran order.');
  }

  return {
    dtype: dtype.name,
    data,
    header,
  };
}

function arrayEqual(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
