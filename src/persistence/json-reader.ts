import type { JsonArray, JsonObject, JsonValue } from '../types/json.js'

/** Parse JSON syntax into its finite value union; malformed text yields null. */
export function parseJson(text: string | null): JsonValue {
  if (text === null) {
    return null
  }

  try {
    // JSON.parse can produce only JSON syntax values. Domain DTOs are constructed
    // by the decoders below this boundary, never asserted onto arbitrary objects.
    const value: JsonValue = JSON.parse(text)
    return value
  } catch {
    return null
  }
}

/** Read a serialized string preference, rejecting other valid JSON shapes. */
export function decodeString(text: string | null): string | null {
  const value = parseJson(text)
  return typeof value === 'string' ? value : null
}

/** Narrow a JSON value to a property object without accepting arrays. */
function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Centralizes primitive shape checks before decoders construct explicit domain contracts. */
export class JsonObjectReader {
  private readonly object: JsonObject

  /** Only the factory constructs a reader after validating the JSON container. */
  private constructor(object: JsonObject) {
    this.object = object
  }

  /** Decode an object container or report that the expected shape is absent. */
  static from(value: JsonValue | undefined): JsonObjectReader | null {
    return isObject(value) ? new JsonObjectReader(value) : null
  }

  /** Preserve the distinction between an explicit null and a missing property. */
  value(key: string): JsonValue | undefined {
    return this.object[key]
  }

  /** Read a string field without allowing numeric or object coercion. */
  string(key: string): string | null {
    const value = this.object[key]
    return typeof value === 'string' ? value : null
  }

  /** Read a finite number, rejecting strings and overflowing JSON exponents. */
  number(key: string): number | null {
    const value = this.object[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }

  /** Read an array container; the owning decoder checks its element contract. */
  array(key: string): JsonArray | null {
    const value = this.object[key]
    return Array.isArray(value) ? value : null
  }

  /** Read a nested object through the same validation boundary. */
  child(key: string): JsonObjectReader | null {
    return JsonObjectReader.from(this.object[key])
  }
}
