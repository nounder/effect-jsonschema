import { test } from "bun:test"
import { Effect, pipe, Schema } from "effect"
import JsonSchemaDraft07Json from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import { JsonSchema } from "./JsonSchemaDraft07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const schema = yield* pipe(
      Schema.decodeUnknown(JsonSchema)(JsonSchemaDraft07Json),
    )

    yield* Effect.log(schema)
  }))
