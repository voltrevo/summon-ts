import { Circuit, CompileResult, DiagnosticLevel, Diagnostics } from './types';

/**
 * Custom error class for handling Summon compilation errors.
 * Extends the built-in Error class and includes additional metadata
 * related to the compilation process, such as the circuit and diagnostics.
 */
export default class CompileError extends Error {
  circuit?: Circuit;
  diagnostics: Diagnostics;

  /**
   * @param {string} message - The error message.
   * @param {CompileResult} compileResult - The result of the compilation process, containing circuit and diagnostics.
   */
  constructor(message: string, compileResult: CompileResult) {
    super(message);
    this.name = 'CompileError';
    this.circuit = compileResult.circuit;
    this.diagnostics = compileResult.diagnostics;
  }
}

/**
 * Extracts the first error message from the diagnostics.
 * Iterates over the diagnostics object to find the first error or internal error message.
 *
 * @param {Diagnostics} diagnostics - The diagnostics object containing compilation messages.
 * @returns {string | undefined} - The first error message found, or undefined if no error is present.
 */
export function getErrorFromDiagnostic(
  diagnostics: Diagnostics,
): string | undefined {
  for (const key in diagnostics) {
    if (diagnostics[key]) {
      for (const diagnostic of diagnostics[key]) {
        // Check if the diagnostic is an error or internal error.
        if (
          diagnostic.level === DiagnosticLevel.Error ||
          diagnostic.level === DiagnosticLevel.InternalError
        ) {
          return diagnostic.message;
        }
      }
    }
  }
}
