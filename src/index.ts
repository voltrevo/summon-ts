import { getWasmLib, initWasmLib } from './wasmLib.js';

export async function init() {
  await initWasmLib();
}

export function compile(
  path: string,
  filesOrFileReader: Record<string, string> | ((path: string) => string),
): CompileOk {
  if (typeof filesOrFileReader === 'function') {
    return getWasmLib().compile_impl_from_file(
      path,
      undefined,
      filesOrFileReader,
    );
  }

  return getWasmLib().compile_impl_from_object(
    path,
    undefined,
    filesOrFileReader,
  );
}

export function compileBoolean(
  path: string,
  boolifyWidth: number,
  filesOrFileReader: Record<string, string> | ((path: string) => string),
): CompileOk {
  if (typeof filesOrFileReader === 'function') {
    return getWasmLib().compile_impl_from_file(
      path,
      boolifyWidth,
      filesOrFileReader,
    );
  }

  return getWasmLib().compile_impl_from_object(
    path,
    boolifyWidth,
    filesOrFileReader,
  );
}

// TODO: Define these types in shared lib.

type Diagnostics = Record<
  string,
  {
    level: string;
    message: string;
    span: {
      start: number;
      end: number;
      ctxt: number;
    };
  }[]
>;

type Circuit = {
  bristol: string;
  info: {
    input_name_to_wire_index: Record<string, number>;
    constants: Record<string, { value: string; wire_index: number }>;
    output_name_to_wire_index: Record<string, number>;
  };
};

type CompileOk = {
  circuit: Circuit;
  diagnostics: Diagnostics;
};
