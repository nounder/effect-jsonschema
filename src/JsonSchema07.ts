/**
 * See: https://www.learnjsonschema.com/draft7/
 * @see https://json-schema.org/learn/glossary
 * @see https://cswr.github.io/JsonSchema
 */
import { pipe, Schema } from "effect"

const SchemaRecur = Schema.suspend((): Schema.Schema<JsonSchema> => JsonSchema)

const CombinatorFields = {
  allOf: Schema.optional(
    Schema.Array(SchemaRecur),
  ),
  anyOf: Schema.optional(
    Schema.Array(SchemaRecur),
  ),
  oneOf: Schema.optional(
    Schema.Array(SchemaRecur),
  ),
  // 'not' keyword works alongside other keywords in the schema, and all conditions are combined with a logical AND.
  // todo narrow only to validation keywords?
  not: Schema.optional(SchemaRecur),
  if: Schema.optional(SchemaRecur),
  then: Schema.optional(SchemaRecur),
  else: Schema.optional(SchemaRecur),
}

const MetadataFields = {
  $id: pipe(
    Schema.String,
    Schema.optional,
  ),
  $schema: pipe(
    Schema.Union(
      Schema.Literal("http://json-schema.org/draft-07/schema#"),
      Schema.String,
    ),
    Schema.optional,
  ),
  title: pipe(
    Schema.String,
    Schema.optional,
  ),
  description: pipe(
    Schema.String,
    Schema.optional,
  ),
  definitions: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: SchemaRecur,
    }),
  ),
}

const makeBaseFields = (
  schema?: Schema.Schema<any, any, never>,
  type?: typeof TypeNames[number],
) => {
  return {
    ...MetadataFields,
    ...CombinatorFields,

    type: type
      ? pipe(
        Schema.Literal(type),
        Schema.optional,
      )
      : Schema.Never,

    const: pipe(
      schema ?? Schema.Never,
      Schema.optional,
    ),
    // The default keyword is a metadata annotation, not a validation keyword.
    // It does not enforce that the default value must conform to the schema's type
    // or other constraints (e.g., minLength, minimum, enum).
    default: pipe(
      Schema.Any,
      Schema.optional,
    ),
    examples: pipe(
      schema ? Schema.Array(schema) : Schema.Never,
      Schema.optional,
    ),
    enum: pipe(
      schema ? Schema.Array(schema) : Schema.Never,
      Schema.optional,
    ),
  }
}

export class BooleanSchema extends Schema.Class<BooleanSchema>("BooleanSchema")({
  ...makeBaseFields(Schema.Boolean),

  type: Schema.Literal("boolean"),
}) {}

// todo: make it generic somehow?
export class ArraySchema extends Schema.Class<ArraySchema>("ArraySchema")({
  ...makeBaseFields(
    Schema.Array(
      Schema.Any,
    ),
    "array",
  ),

  items: Schema.optional(
    // TODO: when items is an array, treat it as tuple-like. note that by default
    // its possible to have fewer elements). to change that, set additionalItems=false
    // https://cswr.github.io/JsonSchema/spec/arrays/
    Schema.Union(
      Schema.Array(SchemaRecur),
      SchemaRecur,
    ),
  ),
  additionalItems: Schema.optional(
    Schema.Union(
      Schema.Boolean,
      SchemaRecur,
    ),
  ),
  minItems: pipe(
    Schema.Number,
    Schema.optional,
  ),
  maxItems: pipe(
    Schema.Number,
    Schema.optional,
  ),
  uniqueItems: pipe(
    Schema.Boolean,
    Schema.optional,
  ),
  contains: Schema.optional(
    SchemaRecur,
  ),
}) {}

export class NullSchema extends Schema.Class<NullSchema>("NullSchema")({
  ...makeBaseFields(Schema.Null),

  type: Schema.Literal("null"),
}) {}

export class StringSchema extends Schema.Class<StringSchema>("StringSchema")({
  ...makeBaseFields(Schema.String, "string"),

  minLength: pipe(
    Schema.Number,
    Schema.optional,
  ),
  maxLength: pipe(
    Schema.Number,
    Schema.optional,
  ),
  pattern: pipe(
    Schema.String,
    Schema.optional,
  ),
  format: pipe(
    Schema.Union(
      Schema.Literal("date-time"),
      Schema.Literal("date"),
      Schema.Literal("time"),
      Schema.Literal("email"),
      Schema.Literal("idn-email"),
      Schema.Literal("hostname"),
      Schema.Literal("idn-hostname"),
      Schema.Literal("ipv4"),
      Schema.Literal("ipv6"),
      Schema.Literal("uri"),
      Schema.Literal("uri-reference"),
      Schema.Literal("iri"),
      Schema.Literal("iri-reference"),
      Schema.Literal("uuid"),
      Schema.Literal("json-pointer"),
      Schema.Literal("relative-json-pointer"),
      Schema.Literal("regex"),
      // Allow custom formats
      Schema.String,
    ),
    Schema.optional,
  ),
  // @see: https://json-schema.org/understanding-json-schema/reference/non_json_data
  contentMediaType: pipe(
    Schema.String,
    Schema.optional,
  ),
  // @see: https://www.learnjsonschema.com/2020-12/content/contentencoding/
  contentEncoding: pipe(
    Schema.Union(
      Schema.Literal("7bit"),
      Schema.Literal("8bit"),
      Schema.Literal("binary"),
      Schema.Literal("base64"),
      Schema.Literal("base32"),
      Schema.Literal("base16"),
      Schema.Literal("quoted-printable"),
      Schema.Literal("binary"),
      Schema.String,
    ),
    Schema.optional,
  ),
}) {}

export class NumberSchema extends Schema.Class<NumberSchema>("NumberSchema")({
  ...makeBaseFields(Schema.Number, "number"),
  minimum: pipe(
    Schema.Number,
    Schema.optional,
  ),
  maximum: pipe(
    Schema.Number,
    Schema.optional,
  ),
  exclusiveMinimum: pipe(
    Schema.Number,
    Schema.optional,
  ),
  exclusiveMaximum: pipe(
    Schema.Number,
    Schema.optional,
  ),
  multipleOf: pipe(
    Schema.Number,
    Schema.optional,
  ),
}) {}

export class IntegerSchema extends Schema.Class<IntegerSchema>("IntegerSchema")({
  ...NumberSchema.fields,
  ...makeBaseFields(Schema.Int, "integer"),
}) {}

export class ObjectSchema extends Schema.Class<ObjectSchema>("ObjectSchema")({
  ...makeBaseFields(
    Schema.Record({
      key: Schema.String,
      value: Schema.Any,
    }),
    "object",
  ),
  // is there a way to do keyof?
  required: pipe(
    Schema.Array(Schema.String),
    Schema.optional,
  ),
  properties: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: SchemaRecur,
    }),
  ),
  additionalProperties: Schema.optional(
    Schema.Union(
      SchemaRecur,
      Schema.Literal(false),
    ),
  ),
  propertyNames: pipe(
    StringSchema,
    Schema.optional,
  ),
  patternProperties: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: SchemaRecur,
    }),
  ),
  dependencies: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Union(
        Schema.Array(Schema.String),
        SchemaRecur,
      ),
    }),
  ),
}) {}

export const TypeSchemas = [
  StringSchema,
  IntegerSchema,
  NumberSchema,
  BooleanSchema,
  NullSchema,
  ArraySchema,
  ObjectSchema,
] as const

export const TypeNames = [
  "string",
  "integer",
  "number",
  "boolean",
  "null",
  "array",
  "object",
] as const

const JsonPointer = pipe(
  Schema.String,
)

const TypeLiteral = Schema.Literal(...TypeNames)

/**
 * JSON Schema can have multiple types and the validation fields are named in a way
 * that they don't conflict across types.
 */
export class JsonSchema extends Schema.Class<JsonSchema>("JsonSchema")({
  ...StringSchema.fields,
  ...IntegerSchema.fields,
  ...NumberSchema.fields,
  ...BooleanSchema.fields,
  ...NullSchema.fields,
  ...ObjectSchema.fields,
  ...ArraySchema.fields,

  // spread it after previous schemas to make sure common fields
  // support all types
  ...makeBaseFields(Schema.Union(
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    Schema.Null,
    Schema.Array(Schema.Any),
    Schema.Record({
      key: Schema.String,
      value: Schema.Any,
    }),
  )),

  type: pipe(
    Schema.Union(
      TypeLiteral,
      Schema.Array(TypeLiteral),
    ),
    Schema.optional,
  ),

  $ref: pipe(
    JsonPointer,
    Schema.optional,
  ),
}) {}
