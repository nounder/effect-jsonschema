/**
 * See: https://www.learnjsonschema.com/draft7/
 * @see https://json-schema.org/learn/glossary
 */
import { pipe, Schema as S } from "effect"

const CombinatorFields = {
  allOf: pipe(
    S.Array(
      S.suspend((): S.Schema<BaseSchema> => BaseSchema),
    ),
    S.optional,
  ),
  anyOf: pipe(
    S.Array(
      S.suspend((): S.Schema<BaseSchema> => BaseSchema),
    ),
    S.optional,
  ),
  oneOf: pipe(
    S.Array(
      S.suspend((): S.Schema<BaseSchema> => BaseSchema),
    ),
    S.optional,
  ),
  not: S.optional(
    S.suspend((): S.Schema<BaseSchema> => BaseSchema),
  ),
  if: S.optional(
    S.suspend((): S.Schema<BaseSchema> => BaseSchema),
  ),
  then: S.optional(
    S.suspend((): S.Schema<BaseSchema> => BaseSchema),
  ),
  else: S.optional(
    S.suspend((): S.Schema<BaseSchema> => BaseSchema),
  ),
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
  definitions: pipe(
    S.Record({
      key: S.String,
      value: S.suspend((): S.Schema<BaseSchema> => BaseSchema),
    }),
    S.optional,
  ),
}

const makeBaseFields = (
  schema?: S.Schema<any, any, never>,
) => {
  return {
    ...MetadataFields,
    ...CombinatorFields,

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
    // 'not' keyword works alongside other keywords in the schema, and all conditions are combined with a logical AND.
    // todo narrow only to validation keywords?
  }
}

export class BaseSchema extends S.Class<BaseSchema>("BaseSchema")({
  ...makeBaseFields(),
}) {}

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
  ),

  type: S.Literal("array"),
  items: pipe(
    S.Array(
      S.suspend((): typeof ValueSchema => ValueSchema),
    ),
    S.optional,
  ),
  additionalItems: S.optional(
    S.Union(
      S.Boolean,
      S.suspend((): typeof ValueSchema => ValueSchema),
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
    S.suspend((): typeof ValueSchema => ValueSchema),
  ),
}) {}

export class NullSchema extends S.Class<NullSchema>("NullSchema")({
  ...makeBaseFields(S.Null),

  type: S.Literal("null"),
}) {}

export class NumberSchema extends S.Class<NumberSchema>("NumberSchema")({
  ...makeBaseFields(S.Number),

  type: S.Literal("number"),
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
  ...NumberSchema.fields,
  ...makeBaseFields(S.Int),

  type: S.Literal("integer"),
}) {}

export class ObjectSchema extends S.Class<ObjectSchema>("ObjectSchema")({
  ...makeBaseFields(
    S.Record({
      key: S.String,
      value: S.Any,
    }),
  ),

  type: S.Literal("object"),
  // is there a way to do keyof?
  required: pipe(
    S.Array(S.String),
    S.optional,
  ),
  properties: pipe(
    S.Record({
      key: S.String,
      value: S.suspend((): typeof BaseSchema => BaseSchema),
    }),
    S.optional,
  ),
  additionalProperties: pipe(
    S.Union(
      S.suspend((): typeof BaseSchema => BaseSchema),
      S.Literal(false),
    ),
    S.optional,
  ),
  propertyNames: pipe(
    S.suspend((): S.Schema<StringSchema> => StringSchema),
    S.optional,
  ),
  patternProperties: pipe(
    S.Record({
      key: S.String,
      value: S.suspend((): typeof BaseSchema => BaseSchema),
    }),
    S.optional,
  ),
  dependencies: pipe(
    S.Record({
      key: S.String,
      value: S.Union(
        S.Array(S.String),
        S.suspend((): S.Schema<BaseSchema> => BaseSchema),
      ),
    }),
    S.optional,
  ),
}) {}

export class StringSchema extends S.Class<StringSchema>("StringSchema")({
  ...makeBaseFields(S.String),

  type: S.Literal("string"),
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

export class JsonSchema extends S.Class<StringSchema>("JsonSchema")({
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

  ...StringSchema.fields,
  ...IntegerSchema.fields,
  ...NumberSchema.fields,
  ...BooleanSchema.fields,
  ...NullSchema.fields,
  ...ObjectSchema.fields,

  type: S.Array(
    S.Literal(...TypeNames),
  ),
}) {}

const JsonPointer = pipe(
  S.String,
  S.pattern(/^#\/.*$/),
)

const RefSchema = S.Struct({
  $ref: JsonPointer,
})

export const ValueSchema = S.Union(
  RefSchema,
  JsonSchema,
)
