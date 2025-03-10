use std::collections::HashMap;

use boolify::boolify;
use console_error_panic_hook::set_once as set_panic_hook;
use js_sys::{Array, Function, Object, Reflect};
use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use summon_compiler::{
    compile as summon_compile, CompileErr, CompileOk, Diagnostic, ResolvedPath,
};
use wasm_bindgen::{prelude::*, JsError};

#[wasm_bindgen]
pub fn init_ext() {
    set_panic_hook();
}

#[wasm_bindgen]
pub fn compile_impl_from_file(
    path: &str,
    boolify_width: Option<usize>,
    read_file: Function,
) -> Result<JsValue, JsError> {
    let compile_result = summon_compile(
        ResolvedPath {
            path: path.to_string(),
        },
        |p| {
            read_file
                .call1(&JsValue::NULL, &JsValue::from_str(p))
                .map_err(|e| e.as_string().unwrap_or_else(|| "Unknown error".to_string()))
                .and_then(|v| {
                    v.as_string()
                        .ok_or_else(|| "Failed to convert JsValue to String".to_string())
                })
        },
    );

    return check_result(compile_result, boolify_width);
}

#[wasm_bindgen]
pub fn compile_impl_from_object(
    path: &str,
    boolify_width: Option<usize>,
    files: JsValue,
) -> Result<JsValue, JsError> {
    let files = convert_jsvalue_to_hashmap(files)?;

    let compile_result = summon_compile(
        ResolvedPath {
            path: path.to_string(),
        },
        |p| files.get(p).ok_or("File not found".into()).cloned(),
    );

    return check_result(compile_result, boolify_width);
}

pub fn check_result(
    compile_result: Result<CompileOk, CompileErr>,
    boolify_width: Option<usize>,
) -> Result<JsValue, JsError> {
    let (circuit, diagnostics) = match compile_result {
        Ok(ok) => (Some(ok.circuit), ok.diagnostics),
        Err(err) => (err.circuit, err.diagnostics),
    };

    // Convert diagnostics keys to strings and serialize it to a JS-friendly format.
    let diagnostics_map: HashMap<String, Vec<Diagnostic>> = diagnostics
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();
    let diagnostics_js =
        diagnostics_map.serialize(&Serializer::new().serialize_maps_as_objects(true))?;

    let mut circuit_js = JsValue::from(Object::new());

    if let Some(circuit) = circuit {
        let mut bristol_circuit = circuit.to_bristol();

        if let Some(boolify_width) = boolify_width {
            bristol_circuit = boolify(&bristol_circuit, boolify_width);
        }

        // Convert the circuit into a raw form and then serialize it to a JS-friendly format.
        circuit_js = bristol_circuit
            .to_raw()?
            .serialize(&Serializer::new().serialize_maps_as_objects(true))?;
    }

    // Return both circuit and diagnostics as a JS value.
    let compile_ok_js = js_sys::Object::new();

    Reflect::set(&compile_ok_js, &JsValue::from_str("circuit"), &circuit_js).map_err(|e| {
        JsError::new(&format!(
            "Error setting property: {}",
            e.as_string().unwrap_or_default()
        ))
    })?;
    Reflect::set(
        &compile_ok_js,
        &JsValue::from_str("diagnostics"),
        &diagnostics_js,
    )
    .map_err(|e| {
        JsError::new(&format!(
            "Error setting property: {}",
            e.as_string().unwrap_or_default()
        ))
    })?;

    Ok(JsValue::from(compile_ok_js))
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
