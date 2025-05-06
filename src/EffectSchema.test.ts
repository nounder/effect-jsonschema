import { test } from "bun:test"
import { Schema, SchemaAST } from "effect"
import MetaschemaDraft07 from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import * as EffectSchema from "./EffectSchema.ts"
import * as JsonSchema07 from "./JsonSchema07.ts"
import { effectFn } from "./testing.ts"

const effect = effectFn()

SchemaAST.Union

test("parse", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(JsonSchema07.FullSchema)(
      MetaschemaDraft07,
    )
    const effectSchema = yield* Schema.decodeUnknown(EffectSchema.FullSchema)(
      decodedSchema,
    )

    console.log(
      Schema.decode(effectSchema)({
        $ref: 23,
      }),
    )
  }))
