import CompileError, { getErrorFromDiagnostic } from './compileError.js';
import never from './helpers/never.js';
import { CompileResult } from './types.js';
import { getWasmLib, initWasmLib } from './wasmLib.js';

export * from './types.js';

/**
 * Ensures that the WASM module is loaded and ready for use.
 */
export async function init() {
  await initWasmLib();
}

/**
 * Compiles the given circuit from a file path, with optional boolean transformation.
 *
 * Files must be provided as a `files` object or a `readFile` function.
 *
 * @param {Object} opt - Options for compilation.
 * @param {string} opt.path - The path to the main circuit file.
 * @param {number | undefined} [opt.boolifyWidth] - Optional parameter for boolean transformation.
 * @param {Record<string, unknown> | undefined} [opt.publicInputs] - Optional: Public inputs for the circuit.
 * @param {((path: string) => string) | undefined} [opt.readFile] - Optional: A function to read file contents.
 * @param {Record<string, string> | undefined} [opt.files] - Optional: An object mapping file names to their contents.
 * @returns {CompileResult} - The result of the compilation process.
 * @throws {CompileError} - If the compilation encounters an error.
 */
export function compile(
  opt: {
    path: string;
    boolifyWidth?: number;
    publicInputs?: Record<string, unknown>;
  } & FilesOrReadFile,
): CompileResult {
  const { path, boolifyWidth, publicInputs = {} } = opt;

  const readFile = (() => {
    if ('readFile' in opt) {
      return opt.readFile;
    }

    if ('files' in opt) {
      return (path: string) => {
        if (path in opt.files) {
          return opt.files[path];
        }

        throw new Error(`File not found: ${path}`);
      };
    }

    never(opt);
  })();

  const wasmLib = getWasmLib();

  // Determine whether to use a function-based or object-based compilation method.
  const compileResult = wasmLib.compile(
    path,
    boolifyWidth,
    JSON.stringify(publicInputs),
    readFile,
  );

  // Extract error message from diagnostics, if any.
  const errorMessage = getErrorFromDiagnostic(compileResult.diagnostics);

  if (errorMessage) {
    throw new CompileError(errorMessage, compileResult);
  }

  return compileResult;
}

type FilesOrReadFile =
  | { files: Record<string, string> }
  | { readFile: (path: string) => string };
