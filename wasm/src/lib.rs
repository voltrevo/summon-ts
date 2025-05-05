use std::collections::HashMap;

use boolify::boolify;
use console_error_panic_hook::set_once as set_panic_hook;
use js_sys::{Function, Object, Reflect};
use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use summon_compiler::{compile as summon_compile, CompileErr, CompileOk, Diagnostic, ResolvedPath};
use wasm_bindgen::{prelude::*, JsError};

#[wasm_bindgen]
pub fn init_ext() {
    set_panic_hook();
}

#[wasm_bindgen]
pub fn compile(
    path: &str,
    boolify_width: Option<usize>,
    public_inputs_json: &str,
    read_file: Function,
) -> Result<JsValue, JsError> {
    let public_inputs =
        serde_json::from_str::<HashMap<String, serde_json::Value>>(public_inputs_json)
            .map_err(|e| JsError::new(&format!("Failed to parse public inputs: {}", e)))?;

    let compile_result = summon_compile(
        ResolvedPath {
            path: path.to_string(),
        },
        &public_inputs,
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

        Reflect::set(
            &circuit_js,
            &JsValue::from_str("mpcSettings"),
            &circuit
                .mpc_settings
                .serialize(&Serializer::new())
                .map_err(|e| JsError::new(&format!("Error serializing mpcSettings: {}", e)))?,
        )
        .map_err(|e| {
            JsError::new(&format!(
                "Error setting property: {}",
                e.as_string().unwrap_or_default()
            ))
        })?;
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
