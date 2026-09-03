/** JSON syntax values, used only inside the persistence decoding boundary. */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray

/** A JSON object can contain only other JSON values. */
export interface JsonObject {
  readonly [key: string]: JsonValue
}

/** A JSON array preserves element order before a decoder builds a domain model. */
export interface JsonArray extends Array<JsonValue> {}
