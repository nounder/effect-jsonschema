import { expect, test } from "bun:test"
import {
  Data,
  Effect,
  Equal,
  identity,
  MutableRef,
  Option,
  ParseResult,
  pipe,
  Pretty,
  Ref,
  Schema,
} from "effect"
import { decode } from "effect/ParseResult"
import { Declaration } from "effect/SchemaAST"
import MetaschemaDraft07 from "../samples/JsonSchemaDraft07MetaSchema.json" with {
  type: "json",
}
import { convert } from "./Converer.ts"
import { JsonSchema } from "./JsonSchema07.ts"
import { effectFn } from "./testing.ts"

{
  const ps: Schema.PropertySignature<":", number, never, "?:", string, never> = Schema
    .makePropertySignature(
      new Schema.PropertySignatureTransformation(
        new Schema.FromPropertySignature(
          Schema.NumberFromString.ast,
          true,
          true,
          {},
          undefined,
        ),
        new Schema.ToPropertySignature(Schema.Number.ast, false, true, {}, undefined),
        Option.orElse(() => Option.some(0)),
        identity,
      ),
    )
  const transform = Schema.Struct({ a: ps })
  const schema = Schema.asSchema(transform)
}

{
  const ps = Schema.propertySignature(Schema.Number).pipe(Schema.fromKey("b"))
  const transform = Schema.Struct({ a: ps })
  const schema = Schema.asSchema(transform)
}

{
  class JsonSchemaContext
    extends Effect.Service<JsonSchemaContext>()("JsonSchemaContext", {
      effect: Effect.gen(function*() {
        const ref = MutableRef.make({
          rootSchema: null as any,
        })

        return {
          ref,
        }
      }),
    })
  {}

  const withTransformation = Schema.transformOrFail(
    JsonSchema,
    JsonSchema,
    {
      strict: true,
      decode: (input, options, ast) =>
        Effect.gen(function*() {
          const ctx = yield* JsonSchemaContext

          ctx.ref.pipe(
            MutableRef.set({
              rootSchema: 23,
            }),
          )

          return input
        }),
      encode: ParseResult.succeed,
    },
  )
  const ps = pipe(
    Schema.propertySignature(Schema.Number),
    Schema.fromKey("b"),
  )
  const transform = Schema.Struct({ a: ps })
  const schema = Schema.asSchema(transform)
}

const effect = effectFn()

test("parse", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(JsonSchema)(MetaschemaDraft07)

    expect(JSON.parse(JSON.stringify(decodedSchema)))
      .toMatchObject(MetaschemaDraft07)
  }))

test("convert", () =>
  effect(function*() {
    const decodedSchema = yield* Schema.decodeUnknown(JsonSchema)(MetaschemaDraft07)

    yield* convert(decodedSchema)
  }))
