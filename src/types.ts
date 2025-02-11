// TODO: Define these types in shared lib.

export enum DiagnosticLevel {
  Lint = 'Lint',
  Error = 'Error',
  InternalError = 'InternalError',
  CompilerDebug = 'CompilerDebug',
}

export type Diagnostic = {
  level: DiagnosticLevel;
  message: string;
  span: {
    start: number;
    end: number;
    ctxt: number;
  };
};

export type Diagnostics = Record<string, Diagnostic[]>;

export type Circuit = {
  bristol: string;
  info: {
    input_name_to_wire_index: Record<string, number>;
    constants: Record<string, { value: string; wire_index: number }>;
    output_name_to_wire_index: Record<string, number>;
  };
};

export type CompileResult = {
  circuit: Circuit;
  diagnostics: Diagnostics;
};
