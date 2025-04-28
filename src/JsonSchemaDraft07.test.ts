import { test } from "bun:test"
import { pipe } from "effect"
import JsonSchemaDraft07Json from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import * as JsonSchemaDraft07 from "./JsonSchemaDraft07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const schema = yield* pipe(
      JsonSchemaDraft07.decodeUnknown(JsonSchemaDraft07Json),
    )
  }))
