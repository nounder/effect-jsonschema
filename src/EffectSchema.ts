import {
  Array,
  Effect,
  identity,
  MutableRef,
  Option,
  ParseResult,
  pipe,
  Schema as S,
  SchemaAST,
} from "effect"
import type { ParseOptions } from "effect/SchemaAST"
import * as JsonSchema from "./JsonSchema07.ts"

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

const JsonSchemaRef = S.transformOrFail(
  JsonSchema.JsonSchemaRef,
  JsonSchema.JsonSchema,
  {
    strict: true,
    decode: (input, options, ast) =>
      Effect.gen(function*() {
        const ctx = yield* JsonSchemaContext

        return {
          $ref: input.$ref,
        } as const
      }),
    encode: (input, parseOptions, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          input,
          "$ref cannot be encoded",
        ),
      )
    },
  },
)

const BooleanSchema = transform(
  JsonSchema.BooleanSchema,
  (v) => Effect.succeed(S.Boolean),
)

// TODO: implement rest of the parameters
const ArraySchema = transform(
  JsonSchema.ArraySchema,
  (v) =>
    Effect.succeed(
      Array.isArray(v.items)
        ? pipe(
          S.Tuple(
            // TODO: implement tuple
          ),
        )
        : pipe(
          S.Array(S.Number),
          v.minItems
            ? S.minItems(v.minItems)
            : identity as any,
          v.maxItems
            ? S.maxItems(v.maxItems!)
            : identity as any,
        ),
    ),
)

const NullSchema = transform(
  JsonSchema.NullSchema,
  (v) => Effect.succeed(S.Null),
)

const StringSchema = transform(
  JsonSchema.StringSchema,
  (v) =>
    Effect.succeed(pipe(
      S.String,
      v.minLength
        ? S.minLength(v.minLength!)
        : identity as any,
      v.maxLength
        ? S.maxLength(v.maxLength!)
        : identity as any,
      v.pattern
        ? S.pattern(new RegExp(v.pattern!))
        : identity as any,
    )),
)

const NumberSchema = transform(
  JsonSchema.NumberSchema,
  (v) =>
    Effect.succeed(pipe(
      S.Number,
      v.minimum
        ? S.greaterThanOrEqualTo(v.minimum!)
        : identity as any,
      v.maximum
        ? S.lessThanOrEqualTo(v.maximum!)
        : identity as any,
      v.exclusiveMinimum
        ? S.greaterThan(v.exclusiveMinimum!)
        : identity as any,
      v.exclusiveMaximum
        ? S.lessThan(v.exclusiveMaximum!)
        : identity as any,
    )),
)

const IntegerSchema = transform(
  JsonSchema.IntegerSchema,
  (v) =>
    Effect.succeed(pipe(
      S.Int,
      v.minimum
        ? S.greaterThanOrEqualTo(v.minimum!)
        : identity as any,
      v.maximum
        ? S.lessThanOrEqualTo(v.maximum!)
        : identity as any,
      v.exclusiveMinimum
        ? S.greaterThan(v.exclusiveMinimum!)
        : identity as any,
      v.exclusiveMaximum
        ? S.lessThan(v.exclusiveMaximum!)
        : identity as any,
    )),
)

const ObjectSchema = transform(
  JsonSchema.ObjectSchema,
  (v) =>
    Effect.succeed(
      pipe(
        S.Record({
          key: S.String,
          value: S.Any,
        }),
      ),
    ),
)

function transform<
  From extends S.Schema.Any,
  To extends S.Annotable.All,
  R = never,
>(
  from: From,
  decode: (
    fromA: S.Schema.Type<From>,
    options: ParseOptions,
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

export const TypedSchema = S.Union(
  StringSchema,
  IntegerSchema,
  NumberSchema,
  BooleanSchema,
  NullSchema,
  ArraySchema,
  ObjectSchema,
)

const MultiTypedSchema = pipe(
  S.Struct(
    {
      type: S.Array(JsonSchema.TypeLiteral),
    },
    S.Record({
      key: S.String,
      value: S.Any,
    }),
  ),
  S.transformOrFail(
    TypedSchema,
    {
      strict: true,
      decode: (fromA, options, ast, fromI) => {
        const values = fromA.type.map(type => ({
          ...fromA,
          type,
        }))
        const matched = Option.firstSomeOf(
          values.map(v => S.decodeOption(JsonSchema.TypedSchema)(v)),
        )

        return ParseResult.fromOption(
          matched,
          () => new ParseResult.Type(ast, fromA),
        )
      },
      encode: (fromA, parseOptions, ast) => {
        return ParseResult.fail(
          new ParseResult.Forbidden(
            ast,
            fromA,
          ),
        )
      },
    },
  ),
  S.compose(TypedSchema),
)

// Order is important here.
export const JsonSchemaDocument = S.Union(
  // resolve refs first as they have strict shape
  JsonSchemaRef,
  // check singular types
  ...TypedSchema.members,
  MultiTypedSchema,
)
