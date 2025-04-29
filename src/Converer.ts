import { Effect, MutableRef, ParseResult, pipe, Schema as S } from "effect"
import { JsonSchema, JsonSchemaLoose, JsonSchemaRef } from "./JsonSchema07.ts"

class JsonSchemaContext extends Effect.Service<JsonSchemaContext>()("JsonSchemaContext", {
  effect: Effect.gen(function*() {
    const ref = MutableRef.make({
      rootSchema: null as any,
    })

    return {
      ref,
    }
  }),
}) {}

const derefJsonSchema = S.transformOrFail(
  JsonSchemaRef,
  JsonSchemaLoose,
  {
    strict: true,
    decode: (input, options, ast) =>
      Effect.gen(function*() {
        return input
      }),
    encode: ParseResult.succeed,
  },
)

// TODO: traverse the schema and replace
const ResolvedJsonSchema = S.Union(
  pipe(
    JsonSchema.members[0],
  ),
  ...JsonSchema.members.slice(1),
)

export const convert = (schema: typeof JsonSchema.Type) => {
  return S.decode(ResolvedJsonSchema)(schema)
}
