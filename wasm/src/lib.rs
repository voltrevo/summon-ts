use std::collections::HashMap;

use wasm_bindgen::{prelude::*, JsError};
use js_sys::{Array, Object, Reflect};
use summon_compiler::{compile as summon_compile, DiagnosticLevel};
use console_error_panic_hook::set_once as set_panic_hook;

#[wasm_bindgen]
pub fn init_ext() {
    set_panic_hook();
}

#[wasm_bindgen]
pub fn compile(path: &str, files: JsValue) -> Result<JsValue, JsError> {
    let files = convert_jsvalue_to_hashmap(files)?;

    let compile_result = summon_compile(
        path,
        |p| files.get(p).ok_or("File not found".into()).cloned(),
    );

    match compile_result {
        Ok(compile_ok) => {
            Ok(serde_wasm_bindgen::to_value(&compile_ok.circuit.to_bristol())?)
        },
        Err(e) => return Err('b: {
            for (_, diagnostics) in e.diagnostics {
                for diagnostic in diagnostics {
                    match diagnostic.level {
                        DiagnosticLevel::Error | DiagnosticLevel::InternalError => {},
                        DiagnosticLevel::CompilerDebug | DiagnosticLevel::Lint => continue,
                    };

                    break 'b JsError::new(&format!(
                        "{}: {}",
                        diagnostic.level,
                        diagnostic.message,
                    ));
                }
            }

            JsError::new("InternalError: Could not find error")
        }),
    }
}

pub fn convert_jsvalue_to_hashmap(value: JsValue) -> Result<HashMap<String, String>, JsError> {
    let object = value
        .dyn_into::<Object>()
        .map_err(|_| JsError::new("Input is not a valid object"))?;

    let keys = Object::keys(&object);
    let mut map = HashMap::new();

    for key in Array::from(&keys).iter() {
        let key_str = key.as_string().ok_or(JsError::new("Key is not a string"))?;
        let value = Reflect::get(&object, &key).map_err(|e| {
            JsError::new(&format!(
                "Error accessing property: {}",
                e.as_string().unwrap_or_default()
            ))
        })?;
        let value_str = value
            .as_string()
            .ok_or(JsError::new("Value is not a string"))?;

        map.insert(key_str, value_str);
    }

    Ok(map)
}
