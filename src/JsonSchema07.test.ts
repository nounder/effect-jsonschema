import { expect, test } from "bun:test"
import { Data, Effect, Equal, pipe, Pretty, Schema } from "effect"
import MetaschemaDraft07 from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import { JsonSchema } from "./JsonSchema07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(JsonSchema)(MetaschemaDraft07)

    expect(JSON.parse(JSON.stringify(decodedSchema)))
      .toMatchObject(MetaschemaDraft07)
  }))
