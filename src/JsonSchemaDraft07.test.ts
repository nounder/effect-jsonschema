import { test } from "bun:test"
import { Data, Effect, Equal, pipe, Pretty, Schema } from "effect"
import JsonSchemaDraft07Json from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import { JsonSchema } from "./JsonSchemaDraft07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(JsonSchema)(JsonSchemaDraft07Json)

    yield* Effect.log(
      Equal.equals(
        Data.struct(decodedSchema),
        Data.struct(JsonSchemaDraft07Json),
      ),
    )

    console.log(decodedSchema)
  }))
