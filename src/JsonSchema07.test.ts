import { expect, test } from "bun:test"
import { Effect, identity, MutableRef, Option, ParseResult, pipe, Schema } from "effect"
import MetaschemaDraft07 from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import { FullSchema } from "./JsonSchema07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(FullSchema)(MetaschemaDraft07)

    expect(JSON.parse(JSON.stringify(decodedSchema)))
      .toMatchObject(MetaschemaDraft07)
  }))
