import CompileError, { getErrorFromDiagnostic } from './compileError.js';
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
 * Handles the compilation process based on the provided input type.
 *
 * @param {string} path - The path to the main circuit file.
 * @param {number | undefined} boolifyWidth - Optional parameter for boolean transformation.
 * @param {Record<string, string> | ((path: string) => string)} filesOrFileReader -
 *        Either an object mapping file names to their contents or a function to fetch file contents dynamically.
 * @returns {CompileResult} - The result of the compilation process.
 * @throws {CompileError} - If the compilation encounters an error.
 */
function compileCircuit(
  path: string,
  boolifyWidth: number | undefined,
  filesOrFileReader: Record<string, string> | ((path: string) => string),
): CompileResult {
  const wasmLib = getWasmLib();

  // Determine whether to use a function-based or object-based compilation method.
  const compileResult =
    typeof filesOrFileReader === 'function'
      ? wasmLib.compile_impl_from_file(path, boolifyWidth, filesOrFileReader)
      : wasmLib.compile_impl_from_object(path, boolifyWidth, filesOrFileReader);

  // Extract error message from diagnostics, if any.
  const errorMessage = getErrorFromDiagnostic(compileResult.diagnostics);

  if (errorMessage) {
    throw new CompileError(errorMessage, compileResult);
  }

  return compileResult;
}

/**
 * Compiles the given circuit from either an object containing files or a file reader function.
 *
 * @param {string} path - The path to the main circuit file.
 * @param {Record<string, string> | ((path: string) => string)} filesOrFileReader -
 *        Either an object mapping file names to their contents or a function to fetch file contents dynamically.
 * @returns {CompileResult} - The result of the compilation process.
 * @throws {CompileError} - If the compilation encounters an error.
 */
export function compile(
  path: string,
  filesOrFileReader: Record<string, string> | ((path: string) => string),
): CompileResult {
  return compileCircuit(path, undefined, filesOrFileReader);
}

/**
 * Compiles the given circuit with boolean transformation (boolification).
 *
 * @param {string} path - The path to the main circuit file.
 * @param {number} boolifyWidth - The width parameter for boolean transformation.
 * @param {Record<string, string> | ((path: string) => string)} filesOrFileReader -
 *        Either an object mapping file names to their contents or a function to fetch file contents dynamically.
 * @returns {CompileResult} - The result of the compilation process.
 * @throws {CompileError} - If the compilation encounters an error.
 */
export function compileBoolean(
  path: string,
  boolifyWidth: number,
  filesOrFileReader: Record<string, string> | ((path: string) => string),
): CompileResult {
  return compileCircuit(path, boolifyWidth, filesOrFileReader);
}
