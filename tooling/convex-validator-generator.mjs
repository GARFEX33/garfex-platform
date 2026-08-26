import { createHash } from "node:crypto";

const digestOf = (text) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
const pascal = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const variable = (value) => value.replace(/[^A-Za-z0-9]/g, "_").replace(/^[0-9]/, "_$&");

export const generateConvexValidators = (manifest, manifestBytes) => {
  const models = new Map(manifest.models.map((definition) => [definition.name, definition]));
  const enums = new Map(manifest.enums.map((definition) => [definition.name, definition]));
  const unions = new Map(manifest.unions.map((definition) => [definition.name, definition]));
  const cache = new Map();
  const emitted = [];
  const emitType = (type) => {
    if (type.kind === "array") return `v.array(${emitType(type.element)})`;
    if (type.kind === "literal") return `v.literal(${JSON.stringify(type.value)})`;
    if (type.kind === "nullable") return `v.union(${emitType(type.type)}, v.null())`;
    if (type.kind === "scalar")
      return type.name === "boolean"
        ? "v.boolean()"
        : type.name === "string"
          ? "v.string()"
          : "v.number()";
    if (type.kind === "object")
      return `v.object({ ${type.properties.map((property) => `${property.name}: ${property.optional ? `v.optional(${emitType(property.type)})` : emitType(property.type)}`).join(", ")} })`;
    if (type.kind === "record") return `v.record(v.string(), ${emitType(type.value)})`;
    if (type.kind === "named") return emitNamed(type.name);
    throw new Error(`unsupported manifest type ${type.kind}`);
  };
  const emitNamed = (name) => {
    if (cache.has(name)) return cache.get(name);
    const nameVariable = variable(name.charAt(0).toLowerCase() + name.slice(1));
    cache.set(name, nameVariable);
    const definition = models.get(name);
    if (definition) {
      const expression = `v.object({ ${definition.properties.map((property) => `${property.name}: ${property.optional ? `v.optional(${emitType(property.type)})` : emitType(property.type)}`).join(", ")} })`;
      emitted.push(`const ${nameVariable} = ${expression};`);
      return nameVariable;
    }
    const enumeration = enums.get(name);
    if (enumeration) {
      const expression =
        enumeration.values.length === 1
          ? `v.literal(${JSON.stringify(enumeration.values[0])})`
          : `v.union(${enumeration.values.map((value) => `v.literal(${JSON.stringify(value)})`).join(", ")})`;
      emitted.push(`const ${nameVariable} = ${expression};`);
      return nameVariable;
    }
    const namedUnion = unions.get(name);
    if (namedUnion) {
      const expression = `v.union(${namedUnion.variants.map((variant) => emitType(variant.type)).join(", ")})`;
      emitted.push(`const ${nameVariable} = ${expression};`);
      return nameVariable;
    }
    const scalarDefinition = manifest.scalars.find((candidate) => candidate.name === name);
    if (scalarDefinition) {
      const expression =
        scalarDefinition.base === "int32"
          ? "v.number()"
          : scalarDefinition.base === "boolean"
            ? "v.boolean()"
            : "v.string()";
      emitted.push(`const ${nameVariable} = ${expression};`);
      return nameVariable;
    }
    throw new Error(`unknown manifest type ${name}`);
  };
  const safeFailure = () => {
    const branch = (code, metadata) => {
      const fields = [`code: v.literal(${JSON.stringify(code)})`];
      if (metadata === "fieldIssues")
        fields.push(`fieldIssues: v.optional(v.array(${fieldIssueName}))`);
      if (metadata === "existingResourceId")
        fields.push(`existingResourceId: v.optional(${resourceIdName})`);
      if (metadata === "currentRevision") fields.push("currentRevision: v.optional(v.number())");
      return `v.object({ ${fields.join(", ")} })`;
    };
    return `v.union(${[
      ["UNAUTHENTICATED"],
      ["FORBIDDEN"],
      ["INVALID_ARGUMENT", "fieldIssues"],
      ["INVALID_REFERENCE", "fieldIssues"],
      ["VALIDATION_FAILED", "fieldIssues"],
      ["NOT_FOUND"],
      ["DUPLICATE", "existingResourceId"],
      ["CONFLICT", "currentRevision"],
      ["INVALID_LIFECYCLE"],
      ["CATALOG_UNAVAILABLE"],
      ["INTERNAL_FAILURE"],
    ]
      .map(([code, metadata]) => branch(code, metadata))
      .join(", ")})`;
  };
  const fieldIssueName = emitNamed("FieldIssue");
  const resourceIdName = emitNamed("ResourceId");
  emitted.push(`const safeFailure = ${safeFailure()};`);
  const operations = [];
  for (const definition of manifest.operations) {
    const args = emitNamed(definition.request);
    const success = emitNamed(definition.success);
    const argsName = `${definition.name}Args`;
    const returnsName = `${definition.name}Returns`;
    emitted.push(`export const ${argsName} = ${args};`);
    emitted.push(
      `export const ${returnsName} = v.union(v.object({ ok: v.literal(true), value: ${success} }), v.object({ ok: v.literal(false), error: safeFailure }));`,
    );
    operations.push(definition.name);
  }
  const digest = digestOf(manifestBytes);
  return [
    "/* GENERATED FILE: derived from semantic-manifest.json; do not edit. */",
    `/* Manifest digest: ${digest} */`,
    'import { v } from "convex/values";',
    `export const manifestDigest = ${JSON.stringify(digest)} as const;`,
    `export const operationNames = ${JSON.stringify(operations)} as const;`,
    ...emitted,
    `export const createResourceMasterContract = { ${operations.map((operation) => `${operation}: ${operation}Args`).join(", ")} };`,
    `export const createResourceMasterReturns = { ${operations.map((operation) => `${operation}: ${operation}Returns`).join(", ")} };`,
    "",
  ].join("\n");
};
