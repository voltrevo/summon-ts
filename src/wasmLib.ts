import * as bindgen from '../srcWasm/summon_ts_wasm.js';

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

let promise: Promise<typeof bindgen> | undefined;
let lib: typeof bindgen | undefined;

export function initWasmLib() {
  promise ??= (async () => {
    const { default: wasmBase64 } = await import(
      '../srcWasm/summon_ts_wasm_base64.js'
    );

    bindgen.initSync(base64ToUint8Array(wasmBase64));
    bindgen.init_ext();
    lib = bindgen;

    return bindgen;
  })();

  return promise;
}

export function getWasmLib() {
  if (lib === undefined) {
    throw new Error('lib not initialized, call summon.init() first');
  }

  return lib;
}
