/**
 * @see https://www.learnjsonschema.com/draft7/
 * @see https://json-schema.org/learn/glossary
 * @see https://cswr.github.io/JsonSchema
 */
import { Option, ParseResult, pipe, Schema as S } from "effect"

const SchemaRecur = S.suspend((): S.Schema<LooseJsonSchema> => FullSchema as any)

const CombinatorFields = {
  allOf: S.optional(
    S.Array(SchemaRecur),
  ),
  anyOf: S.optional(
    S.Array(SchemaRecur),
  ),
  oneOf: S.optional(
    S.Array(SchemaRecur),
  ),
  // 'not' keyword works alongside other keywords in the schema, and all conditions are combined with a logical AND.
  // todo narrow only to validation keywords?
  not: S.optional(SchemaRecur),
  if: S.optional(SchemaRecur),
  then: S.optional(SchemaRecur),
  else: S.optional(SchemaRecur),
}

const MetadataFields = {
  $id: pipe(
    S.String,
    S.optional,
  ),
  $schema: pipe(
    S.Union(
      S.Literal("http://json-schema.org/draft-07/schema#"),
      S.String,
    ),
    S.optional,
  ),
  title: pipe(
    S.String,
    S.optional,
  ),
  description: pipe(
    S.String,
    S.optional,
  ),
  definitions: S.optional(
    S.Record({
      key: S.String,
      value: SchemaRecur,
    }),
  ),
}

const makeBaseFields = (
  schema?: S.Schema<any, any, never>,
  type?: typeof TypeNames[number],
) => {
  return {
    ...MetadataFields,
    ...CombinatorFields,

    type: type
      ? pipe(
        S.Literal(type),
        S.optional,
      )
      : S.Never,

    const: pipe(
      schema ?? S.Never,
      S.optional,
    ),
    // The default keyword is a metadata annotation, not a validation keyword.
    // It does not enforce that the default value must conform to the schema's type
    // or other constraints (e.g., minLength, minimum, enum).
    default: pipe(
      S.Any,
      S.optional,
    ),
    examples: pipe(
      schema ? S.Array(schema) : S.Never,
      S.optional,
    ),
    enum: pipe(
      schema ? S.Array(schema) : S.Never,
      S.optional,
    ),
  }
}

export class BooleanSchema extends S.Class<BooleanSchema>("BooleanSchema")({
  ...makeBaseFields(S.Boolean),

  type: S.Literal("boolean"),
}) {}

// todo: make it generic somehow?
export class ArraySchema extends S.Class<ArraySchema>("ArraySchema")({
  ...makeBaseFields(
    S.Array(
      S.Any,
    ),
    "array",
  ),

  items: S.optional(
    // TODO: when items is an array, treat it as tuple-like. note that by default
    // its possible to have fewer elements). to change that, set additionalItems=false
    // https://cswr.github.io/JsonSchema/spec/arrays/
    S.Union(
      S.Array(SchemaRecur),
      SchemaRecur,
    ),
  ),
  additionalItems: S.optional(
    S.Union(
      S.Boolean,
      SchemaRecur,
    ),
  ),
  minItems: pipe(
    S.Number,
    S.optional,
  ),
  maxItems: pipe(
    S.Number,
    S.optional,
  ),
  uniqueItems: pipe(
    S.Boolean,
    S.optional,
  ),
  contains: S.optional(
    SchemaRecur,
  ),
}) {}

export class NullSchema extends S.Class<NullSchema>("NullSchema")({
  ...makeBaseFields(S.Null),

  type: S.Literal("null"),
}) {}

export class StringSchema extends S.Class<StringSchema>("StringSchema")({
  ...makeBaseFields(S.String, "string"),

  minLength: pipe(
    S.Number,
    S.optional,
  ),
  maxLength: pipe(
    S.Number,
    S.optional,
  ),
  pattern: pipe(
    S.String,
    S.optional,
  ),
  format: pipe(
    S.Union(
      S.Literal("date-time"),
      S.Literal("date"),
      S.Literal("time"),
      S.Literal("email"),
      S.Literal("idn-email"),
      S.Literal("hostname"),
      S.Literal("idn-hostname"),
      S.Literal("ipv4"),
      S.Literal("ipv6"),
      S.Literal("uri"),
      S.Literal("uri-reference"),
      S.Literal("iri"),
      S.Literal("iri-reference"),
      S.Literal("uuid"),
      S.Literal("json-pointer"),
      S.Literal("relative-json-pointer"),
      S.Literal("regex"),
      // Allow custom formats
      S.String,
    ),
    S.optional,
  ),
  // @see: https://json-schema.org/understanding-json-schema/reference/non_json_data
  contentMediaType: pipe(
    S.String,
    S.optional,
  ),
  // @see: https://www.learnjsonschema.com/2020-12/content/contentencoding/
  contentEncoding: pipe(
    S.Union(
      S.Literal("7bit"),
      S.Literal("8bit"),
      S.Literal("binary"),
      S.Literal("base64"),
      S.Literal("base32"),
      S.Literal("base16"),
      S.Literal("quoted-printable"),
      S.Literal("binary"),
      S.String,
    ),
    S.optional,
  ),
}) {}

export class NumberSchema extends S.Class<NumberSchema>("NumberSchema")({
  ...makeBaseFields(S.Number, "number"),
  minimum: pipe(
    S.Number,
    S.optional,
  ),
  maximum: pipe(
    S.Number,
    S.optional,
  ),
  exclusiveMinimum: pipe(
    S.Number,
    S.optional,
  ),
  exclusiveMaximum: pipe(
    S.Number,
    S.optional,
  ),
  multipleOf: pipe(
    S.Number,
    S.optional,
  ),
}) {}

export class IntegerSchema extends S.Class<IntegerSchema>("IntegerSchema")({
  ...makeBaseFields(S.Int, "integer"),
  minimum: pipe(
    S.Int,
    S.optional,
  ),
  maximum: pipe(
    S.Int,
    S.optional,
  ),
  exclusiveMinimum: pipe(
    S.Int,
    S.optional,
  ),
  exclusiveMaximum: pipe(
    S.Int,
    S.optional,
  ),
  multipleOf: pipe(
    S.Int,
    S.optional,
  ),
}) {}

export class ObjectSchema extends S.Class<ObjectSchema>("ObjectSchema")({
  ...makeBaseFields(
    S.Record({
      key: S.String,
      value: S.Any,
    }),
    "object",
  ),
  // is there a way to do keyof?
  required: pipe(
    S.Array(S.String),
    S.optional,
  ),
  properties: S.optional(
    S.Record({
      key: S.String,
      value: SchemaRecur,
    }),
  ),
  additionalProperties: S.optional(
    S.Union(
      SchemaRecur,
      S.Literal(false),
    ),
  ),
  propertyNames: pipe(
    StringSchema,
    S.optional,
  ),
  patternProperties: S.optional(
    S.Record({
      key: S.String,
      value: SchemaRecur,
    }),
  ),
  dependencies: S.optional(
    S.Record({
      key: S.String,
      value: S.Union(
        S.Array(S.String),
        SchemaRecur,
      ),
    }),
  ),
}) {}

const JsonPointer = pipe(
  S.String,
)

export const TypeNames = [
  "object",
  "array",
  "string",
  "integer",
  "number",
  "boolean",
  "null",
] as const

export const TypeKeywordValue = S.Literal(...TypeNames)

/**
 * Schemas with a single 'type' keyword
 */
export const TypedSchema = S.Union(
  ObjectSchema,
  ArraySchema,
  StringSchema,
  IntegerSchema,
  NumberSchema,
  BooleanSchema,
  NullSchema,
)

/**
 * Schemas without a 'type' keyword
 */
export const UntypedSchema = S.Union(
  ObjectSchema.pipe(S.omit("type")),
  ArraySchema.pipe(S.omit("type")),
  StringSchema.pipe(S.omit("type")),
  IntegerSchema.pipe(S.omit("type")),
  NumberSchema.pipe(S.omit("type")),
  BooleanSchema.pipe(S.omit("type")),
  NullSchema.pipe(S.omit("type")),
)

/**
 * Schemas with a 'type' keyword that have multiple values.
 */
export const MultitypedSchema = S.extend(
  UntypedSchema,
  S.Struct({
    type: S.Array(TypeKeywordValue),
  }),
)

/**
 * Tranform schema without a 'type' keyword to a schema with a 'type' keyword
 * based on other keywords.
 */
export const ExpandedUntypedSchema = pipe(
  UntypedSchema,
  S.transformOrFail(
    TypedSchema,
    {
      strict: true,
      decode: (fromA, options, ast, fromI) => {
        const matched = Option.firstSomeOf(
          TypeNames.map((type) => {
            return S.decodeOption(TypedSchema)({
              ...fromA,
              type: "string",
            })
          }),
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
)

/**
 * Transform multiple types into a single type based on keywords
 * used in schema.
 */
const SingularizedMultitypedSchema = pipe(
  MultitypedSchema,
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
          values.map(v => S.decodeOption(TypedSchema)(v)),
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

/**
 * A reference to another schema.
 */
export class RefSchema extends S.Class<RefSchema>("RefSchema")({
  $ref: pipe(
    JsonPointer,
  ),
}) {}

/**
 * JSON Schema can have multiple types and the validation fields are named in a way
 * that they don't conflict across types.
 *
 * We only use it as a type to avoid circular references.
 */
class LooseJsonSchema extends S.Class<LooseJsonSchema>("LooseJsonSchema")({
  ...StringSchema.fields,
  ...IntegerSchema.fields,
  ...NumberSchema.fields,
  ...BooleanSchema.fields,
  ...NullSchema.fields,
  ...ObjectSchema.fields,
  ...ArraySchema.fields,

  // spread it after previous schemas to make sure common fields
  // support all types
  ...makeBaseFields(S.Union(
    S.String,
    S.Number,
    S.Boolean,
    S.Null,
    S.Array(S.Any),
    S.Record({
      key: S.String,
      value: S.Any,
    }),
  )),

  type: pipe(
    S.Union(
      TypeKeywordValue,
      S.Array(TypeKeywordValue),
    ),
    S.optional,
  ),
}) {
  readonly $ref?: string
}

// Order is important here.
export const FullSchema = S.Union(
  RefSchema,
  TypedSchema,
  MultitypedSchema,
  UntypedSchema,
)
