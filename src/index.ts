import { getWasmLib, initWasmLib } from './wasmLib.js';
import {isNodeEnv} from './utils.js';

let fs: any

export async function init() {
  await initWasmLib();

  if (isNodeEnv()) {
      fs = await import('fs')
  }
}

export function compile(
  path: string,
  files?: Record<string, string>,
): Circuit {
  if (!files) {
    if (!fs) {
        throw new Error('Circuit object must be provided outside of Node.js')
    }

    return getWasmLib().compile_impl_from_file(
      path,
      undefined,
      (filePath: string) => fs.readFileSync(filePath, 'utf8')
    );
  }

  return getWasmLib().compile_impl_from_object(path, undefined, files);
}

export function compileBoolean(
  path: string,
  boolifyWidth: number,
  files?: Record<string, string>,
): Circuit {
  if (!files) {
    if (!fs) {
        throw new Error('Circuit object must be provided outside of Node.js')
    }

    return getWasmLib().compile_impl_from_file(
      path,
      boolifyWidth,
      (filePath: string) => fs.readFileSync(filePath, 'utf8')
    );
  }

  return getWasmLib().compile_impl_from_object(path, boolifyWidth, files);
}

// TODO: Define this in shared lib
type Circuit = {
  bristol: string;
  info: {
    input_name_to_wire_index: Record<string, number>;
    constants: Record<string, { value: string; wire_index: number }>;
    output_name_to_wire_index: Record<string, number>;
  };
};
