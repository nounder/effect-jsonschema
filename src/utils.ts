import { Effect, ParseResult, pipe, Schema as S, SchemaAST } from "effect"

/**
 * Transform JSON Schema into Effect Schema.
 */
export function transformSchema<
  From extends S.Schema.Any,
  To extends S.Annotable.All,
  R = never,
>(
  from: From,
  decode: (
    fromA: S.Schema.Type<From>,
    options: SchemaAST.ParseOptions,
    ast: SchemaAST.Transformation,
    fromI: S.Schema.Encoded<From>,
  ) => Effect.Effect<S.Schema.Encoded<To>, ParseResult.ParseIssue, R>,
) {
  return S.transformOrFail(from, S.Any, {
    strict: true,
    decode: (fromA, options, ast, fromI) =>
      pipe(
        decode(fromA, options, ast, fromI),
        Effect.map(
          S.annotations({
            title: fromA.title,
            default: fromA.default,
            examples: fromA.examples as any,
            jsonSchema: {
              contentEncoding: fromA.contentEncoding,
              contentMediaType: fromA.contentMediaType,
            },
          }),
        ),
      ),
    encode: (input, parseOptions, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          input,
        ),
      )
    },
  })
}
