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
    constants: (CircuitIOInfo & { value: unknown })[];
    inputs: CircuitIOInfo[];
    outputs: CircuitIOInfo[];
  };
  mpcSettings: MpcParticipantSettings[];
};

export type CircuitIOInfo = {
  name: string;
  type: unknown;
  address: number;
  width: number;
};

export type CompileResult = {
  circuit: Circuit;
  diagnostics: Diagnostics;
};

type MpcParticipantSettings = {
  name: string;
  inputs: string[];
  outputs: string[];
};
