import {
  Array,
  Effect,
  identity,
  Iterable,
  MutableRef,
  Option,
  ParseResult,
  pipe,
  Schema as S,
} from "effect"
import * as JsonSchema from "./JsonSchema07.ts"
import { transformSchema } from "./utils.ts"

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

const RefSchema = S.transformOrFail(
  JsonSchema.RefSchema,
  JsonSchema.FullSchema,
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

const BooleanSchema = transformSchema(
  JsonSchema.BooleanSchema,
  (v) => Effect.succeed(S.Boolean),
)

// TODO: implement rest of the parameters
const ArraySchema = transformSchema(
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

const NullSchema = transformSchema(
  JsonSchema.NullSchema,
  (v) => Effect.succeed(S.Null),
)

const StringSchema = transformSchema(
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

const NumberSchema = transformSchema(
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

const IntegerSchema = transformSchema(
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

const ObjectSchema = transformSchema(
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

export const TypedSchema = S.Union(
  ObjectSchema,
  ArraySchema,
  StringSchema,
  IntegerSchema,
  NumberSchema,
  BooleanSchema,
  NullSchema,
)

export const UntypedSchema = transformSchema(
  JsonSchema.UntypedSchema,
  (v, _, ast) => {
    const match = pipe(
      S.decodeOption(JsonSchema.ExpandedUntypedSchema)(v),
      Option.map(S.decode(TypedSchema)),
    )

    return ParseResult.fromOption(
      match,
      () => new ParseResult.Type(ast, v),
    )
  },
)

export const MultitypedSchema = transformSchema(
  JsonSchema.MultitypedSchema,
  (v, _, ast) => {
    const values = v.type.map(type => ({
      ...v,
      type,
    }))
    const match = Option.firstSomeOf(
      values.map(v => S.decodeOption(TypedSchema)(v)),
    )

    return ParseResult.fromOption(
      match,
      () => new ParseResult.Type(ast, v),
    )
  },
)

export const FullSchema = S.Union(
  RefSchema,
  TypedSchema,
  MultitypedSchema,
  UntypedSchema,
)
