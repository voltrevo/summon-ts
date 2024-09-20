import { getWasmLib, initWasmLib } from './wasmLib';

export async function init() {
  await initWasmLib();
}

export function compile(
  path: string,
  files: Record<string, string>,
): Circuit {
  return getWasmLib().compile(path, files);
}

export function compileBoolean(
  path: string,
  boolifyWidth: number,
  files: Record<string, string>,
): Circuit {
  return getWasmLib().compile_boolean(path, boolifyWidth, files);
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
