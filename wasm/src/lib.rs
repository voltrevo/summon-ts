use std::collections::HashMap;

use boolify::boolify;
use console_error_panic_hook::set_once as set_panic_hook;
use js_sys::{Function, Object, Reflect};
use serde::Serialize;
use serde_wasm_bindgen::Serializer;
use summon_compiler::{compile as summon_compile, Diagnostic, ResolvedPath};
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

    let (circuit, diagnostics) = match compile_result {
        Ok(ok) => (Some(ok.circuit), ok.diagnostics),
        Err(err) => (err.circuit, err.diagnostics),
    };

    let res = JsValue::from(Object::new());

    if let Some(circuit) = circuit {
        let mut bristol_circuit = circuit.to_bristol();

        if let Some(boolify_width) = boolify_width {
            bristol_circuit = boolify(&bristol_circuit, boolify_width);
        }

        // Convert the circuit into a raw form and then serialize it to a JS-friendly format.
        let circuit_js = bristol_circuit
            .to_raw()?
            .serialize(&Serializer::new().serialize_maps_as_objects(true))?;

        set_property(
            &circuit_js,
            "mpcSettings",
            &circuit
                .mpc_settings
                .serialize(&Serializer::new())
                .map_err(|e| JsError::new(&format!("Error serializing mpcSettings: {}", e)))?,
        )?;

        set_property(&res, "circuit", &circuit_js)?;
    }

    set_property(&res, "diagnostics", &diagnostics_to_js(diagnostics)?)?;

    Ok(res)
}

fn set_property(obj: &JsValue, prop: &str, value: &JsValue) -> Result<(), JsError> {
    Reflect::set(obj, &JsValue::from_str(prop), value).map_err(|e| {
        JsError::new(&format!(
            "Error setting property: {}",
            e.as_string().unwrap_or_default()
        ))
    })?;

    Ok(())
}

fn diagnostics_to_js(
    diagnostics: HashMap<ResolvedPath, Vec<Diagnostic>>,
) -> Result<JsValue, JsError> {
    let diagnostics_map: HashMap<String, Vec<Diagnostic>> = diagnostics
        .into_iter()
        .map(|(key, value)| (key.to_string(), value))
        .collect();

    let res = diagnostics_map.serialize(&Serializer::new().serialize_maps_as_objects(true))?;

    Ok(res)
}
