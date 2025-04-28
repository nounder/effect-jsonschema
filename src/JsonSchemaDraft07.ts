
/**
 * See: https://www.learnjsonschema.com/draft7/
 */
import { pipe, Schema as S, Schema } from "effect"

const makeGenericValueFields = (
  schema: S.Schema<any, any, never> | S.Schema<never, never, never>,
) => {
  return {
    const: pipe(
      schema,
      S.optional,
    ),
    default: pipe(
      schema,
      S.optional,
    ),
    examples: pipe(
      schema,
      S.optional,
    ),
    enum: pipe(
      schema,
      S.optional,
    ),
    // 'not' keyword works alongside other keywords in the schema, and all conditions are combined with a logical AND.
    // todo narrow only to validation keywords?
    not: S.optional(
      S.suspend((): S.Schema<BaseSchema> => BaseSchema),
    ),
  }
}

const combinatorFields = {
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
}

export class BaseSchema extends S.Class<BaseSchema>("BaseSchema")({
  ...combinatorFields,
  ...makeGenericValueFields(S.Never),

  $id: pipe(
    S.String,
    S.optional,
  ),
  $schema: pipe(
    S.String,
    S.optional,
  ),
  $ref: pipe(
    S.String,
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
}) { }

export class BooleanSchema extends S.Class<BooleanSchema>("BooleanSchema")({
  ...makeGenericValueFields(S.Boolean),

  type: S.Literal("boolean"),
}) { }

// todo: make it generic somehow?
export class ArraySchema extends S.Class<ArraySchema>("ArraySchema")({
  ...makeGenericValueFields(
    S.Array(
      S.Any,
    ),
  ),

  type: S.Literal("array"),
  items: pipe(
    // TODO: Should it be a ValueSchema?
    S.Array(BaseSchema),
    S.optional,
  ),
  additionalItems: S.optional(
    S.suspend((): typeof ValueSchema => ValueSchema),
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
}) { }

export class NullSchema extends S.Class<NullSchema>("NullSchema")({
  ...makeGenericValueFields(S.Null),

  type: S.Literal("null"),
}) { }

export class NumberSchema extends S.Class<NumberSchema>("NumberSchema")({
  ...makeGenericValueFields(S.Number),

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
}) { }

export class IntegerSchema extends S.Class<IntegerSchema>("IntegerSchema")({
  ...NumberSchema.fields,
  ...makeGenericValueFields(S.Int),

  type: S.Literal("integer"),
}) { }

export class ObjectSchema extends S.Class<ObjectSchema>("ObjectSchema")({
  ...makeGenericValueFields(
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
      value: S.Any,
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
    S.Struct({
      // TODO: this should be a StringSchema?
      type: pipe(
        S.Literal("string"),
        S.optional,
      ),
      pattern: S.String,
    }),
    S.optional,
  ),
  patternProperties: pipe(
    S.Record({
      key: S.String,
      value: S.suspend((): typeof BaseSchema => BaseSchema),
    }),
    S.optional,
  ),
  // TODO: to implement
  dependencies: pipe(
    S.Never,
    S.optional,
  ),
}) { }

export class StringSchema extends S.Class<StringSchema>("StringSchema")({
  ...makeGenericValueFields(S.String),

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
  // TODO: format can be extended
  format: pipe(
    S.String,
    S.optional,
  ),
}) { }

export class MultiSchema extends S.Class<StringSchema>("MultiSchema")({
  ...makeGenericValueFields(S.Union(
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
    S.Literal(
      "string",
      "number",
      "boolean",
      "null",
      "array",
      "object",
    ),
  ),
}) { }

export const SimpleSchema = Schema.Union(
  BooleanSchema,
  IntegerSchema,
  NullSchema,
  NumberSchema,
  StringSchema,
  ObjectSchema,
  // S.suspend((): S.Schema<ArraySchema> => ArraySchema),
)

export const RootSchema = Schema.Union(
  MultiSchema,
  ...SimpleSchema.members,
)

export const ValueSchema = Schema.Union(
  S.Struct({
    $ref: S.String,
  }),
  ...RootSchema.members,
)

export const decodeUnknown = Schema.decodeUnknown(RootSchema)
