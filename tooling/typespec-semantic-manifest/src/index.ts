import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { relative } from "node:path";
import {
  emitFile,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMinItems,
  getMinLength,
  getMinValue,
  getNamespaceFullName,
  getPattern,
  isArrayModelType,
  isRecordModelType,
  navigateProgram,
  navigateType,
  resolvePath,
  walkPropertiesInherited,
} from "@typespec/compiler";
import type {
  EmitContext,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  SemanticNodeListener,
  Type,
  Union,
} from "@typespec/compiler";
import {
  externalOperationNames,
  getExternalContractApplications,
  getExternalContractMetadata,
  resourceMasterNamespace,
} from "./decorators.ts";
import {
  canonicalOperationOrder,
  MANIFEST_SCHEMA_REVISION,
  serializeManifest,
  type EnumDefinition,
  type ManifestProvenance,
  type ModelDefinition,
  type ModelPropertyDefinition,
  type OperationDefinition,
  type ScalarConstraints,
  type ScalarDefinition,
  type SemanticManifest,
  type SemanticType,
  type UnionDefinition,
  type UnionVariantDefinition,
} from "./manifest-model.ts";
import { reportDiagnostic } from "./lib.ts";

const require = createRequire(import.meta.url);
const compilerPackage = require("@typespec/compiler/package.json") as {
  readonly version?: unknown;
};
const emitterPackage = require("../package.json") as { readonly version?: unknown };

const emitterName = "@garfex/typespec-semantic-manifest";
const compilerVersion =
  typeof compilerPackage.version === "string" ? compilerPackage.version : "unknown";
const emitterVersion =
  typeof emitterPackage.version === "string" ? emitterPackage.version : "unknown";

const builtInScalars = new Set([
  "bytes",
  "boolean",
  "decimal",
  "decimal128",
  "duration",
  "float",
  "float32",
  "float64",
  "int8",
  "int16",
  "int32",
  "int64",
  "integer",
  "numeric",
  "offsetDateTime",
  "plainDate",
  "plainTime",
  "safeint",
  "string",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "url",
  "utcDateTime",
]);

const authorityFieldPattern = /^(actor|role|capabilit|claim|token|credential|session|provider)/i;
const platformPattern = /convex|backend|persistence|repository|deployment|platform/i;
const transportPattern =
  /(^|[.:@])(http|rest|openapi|scalar|orval|route|header|statuscode|transport)(?:$|[.:@])/i;

const normalizeIdentifier = (value: string): string => value.normalize("NFKC");
const normalizeSource = (value: string): string =>
  value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const digest = (value: string): string =>
  `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;

const namespaceName = (namespace: Namespace): string => getNamespaceFullName(namespace);
const isResourceMasterNamespace = (namespace: Namespace | undefined): boolean =>
  namespace !== undefined && namespaceName(namespace) === resourceMasterNamespace;

function findNamespace(namespace: Namespace, expectedName: string): Namespace | undefined {
  if (namespaceName(namespace) === expectedName) return namespace;
  for (const child of namespace.namespaces.values()) {
    const found = findNamespace(child, expectedName);
    if (found !== undefined) return found;
  }
  return undefined;
}

const fullName = (type: Type): string => {
  if (!("name" in type) || typeof type.name !== "string") return type.kind;
  const namespace = "namespace" in type ? type.namespace : undefined;
  return namespace === undefined ? type.name : `${namespaceName(namespace)}.${type.name}`;
};

const isBuiltInScalar = (type: Scalar): boolean => builtInScalars.has(type.name);
const isNamedResourceType = (
  type: Type,
): type is Type & { readonly name: string; readonly namespace: Namespace } =>
  "name" in type &&
  typeof type.name === "string" &&
  type.name.length > 0 &&
  "namespace" in type &&
  isResourceMasterNamespace(type.namespace);

const isNullType = (type: Type): boolean => type.kind === "Intrinsic" && type.name === "null";

const isTransportDecorator = (name: string): boolean =>
  transportPattern.test(name) || /(?:^|\.)TypeSpec\.(Http|Rest|OpenAPI)\b/i.test(name);

interface EmitterDiagnostics {
  readonly program: Program;
  hasError: boolean;
  metadata(): void;
  operation(reason: string, target: Type): void;
  transport(name: string, target: Type): void;
  duplicate(name: string, target: Type): void;
  unsupported(name: string, target: Type): void;
  recursive(name: string, target: Type): void;
  failed(): void;
}

const diagnosticsFor = (program: Program): EmitterDiagnostics => ({
  program,
  hasError: false,
  metadata() {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-metadata",
      target: program.getGlobalNamespaceType(),
    });
  },
  operation(reason, target) {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-operation",
      target,
      format: { reason },
    });
  },
  transport(name, target) {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-transport",
      target,
      format: { name },
    });
  },
  duplicate(name, target) {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-duplicate",
      target,
      format: { name },
    });
  },
  unsupported(name, target) {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-unsupported",
      target,
      format: { name },
    });
  },
  recursive(name, target) {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-recursive",
      target,
      format: { name },
    });
  },
  failed() {
    this.hasError = true;
    reportDiagnostic(program, {
      code: "external-contract-emitter-failed",
      target: program.getGlobalNamespaceType(),
    });
  },
});

const inspectDecorators = (diagnostics: EmitterDiagnostics, type: Type): void => {
  if (!("decorators" in type)) return;
  for (const application of type.decorators) {
    const name = application.definition?.name ?? "unknown";
    const namespace = application.definition?.namespace;
    const qualifiedName = namespace === undefined ? name : `${namespaceName(namespace)}.${name}`;
    if (isTransportDecorator(name) || isTransportDecorator(qualifiedName)) {
      diagnostics.transport(qualifiedName, type);
    }
  }
};

const inspectProgramDecorators = (program: Program, diagnostics: EmitterDiagnostics): void => {
  const listener: SemanticNodeListener = {
    namespace: (namespace) => inspectDecorators(diagnostics, namespace),
    operation: (operation) => inspectDecorators(diagnostics, operation),
    model: (model) => inspectDecorators(diagnostics, model),
    modelProperty: (property) => inspectDecorators(diagnostics, property),
    scalar: (scalar) => inspectDecorators(diagnostics, scalar),
    enum: (enumeration) => inspectDecorators(diagnostics, enumeration),
    union: (union) => inspectDecorators(diagnostics, union),
  };
  navigateProgram(program, listener);
};

const sourceDigestFor = (program: Program): string => {
  const sources = [...program.sourceFiles.values()]
    .map((script) => script.file)
    .filter((source) => {
      try {
        return program.getSourceFileLocationContext(source).type === "project";
      } catch {
        return false;
      }
    })
    .map((source) => {
      const path = relative(program.projectRoot, source.path).replaceAll("\\", "/");
      return `${path}\u0000${normalizeSource(source.text)}\u0000`;
    })
    .sort((left, right) => left.localeCompare(right, "en"));
  return digest(sources.join(""));
};

const optionsDigestFor = (options: Record<string, unknown>): string =>
  digest(JSON.stringify(canonicalOptions(options)));

const canonicalOptions = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalOptions);
  if (typeof value !== "object" || value === null) return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => [key, canonicalOptions(record[key])]),
  );
};

const constraintsFor = (program: Program, type: Type): ScalarConstraints => {
  const minLength = getMinLength(program, type);
  const maxLength = getMaxLength(program, type);
  const minValue = getMinValue(program, type);
  const maxValue = getMaxValue(program, type);
  const minItems = getMinItems(program, type);
  const maxItems = getMaxItems(program, type);
  const pattern = getPattern(program, type);

  return {
    ...(minLength === undefined ? {} : { minLength }),
    ...(maxLength === undefined ? {} : { maxLength }),
    ...(minValue === undefined ? {} : { minValue }),
    ...(maxValue === undefined ? {} : { maxValue }),
    ...(minItems === undefined ? {} : { minItems }),
    ...(maxItems === undefined ? {} : { maxItems }),
    ...(pattern === undefined ? {} : { pattern }),
  };
};

const scalarBaseName = (scalar: Scalar): string => {
  const visited = new Set<Scalar>();
  let current = scalar;
  while (current.baseScalar !== undefined && !visited.has(current)) {
    visited.add(current);
    if (isBuiltInScalar(current.baseScalar)) return current.baseScalar.name;
    current = current.baseScalar;
  }
  return current.name;
};

const modelProperties = (model: Model): readonly ModelProperty[] => [
  ...walkPropertiesInherited(model),
];

const checkNameCollection = (
  diagnostics: EmitterDiagnostics,
  values: readonly { readonly name: string }[],
  target: Type,
): void => {
  const seen = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizeIdentifier(value.name);
    const previous = seen.get(normalized);
    if (previous !== undefined) diagnostics.duplicate(value.name, target);
    else seen.set(normalized, value.name);
  }
};

const isSafeUnionNullability = (union: Union): Type | undefined => {
  if (!union.expression || union.variants.size !== 2) return undefined;
  const nonNull = [...union.variants.values()].filter((variant) => !isNullType(variant.type));
  return nonNull.length === 1 ? nonNull[0]?.type : undefined;
};

const typeReference = (
  program: Program,
  diagnostics: EmitterDiagnostics,
  type: Type,
  target: Type,
): SemanticType | undefined => {
  switch (type.kind) {
    case "Scalar":
      if (isBuiltInScalar(type)) return { kind: "scalar", name: type.name };
      if (isNamedResourceType(type)) return { kind: "named", name: type.name };
      diagnostics.unsupported(fullName(type), target);
      return undefined;
    case "Model":
      if (isArrayModelType(type)) {
        const element = typeReference(program, diagnostics, type.indexer.value, target);
        return element === undefined ? undefined : { kind: "array", element };
      }
      if (isRecordModelType(type)) {
        const value = typeReference(program, diagnostics, type.indexer.value, target);
        return value === undefined ? undefined : { kind: "record", value };
      }
      if (type.indexer !== undefined) {
        diagnostics.unsupported(fullName(type), target);
        return undefined;
      }
      if (isNamedResourceType(type)) return { kind: "named", name: type.name };
      if (type.node !== undefined) {
        const properties: ModelPropertyDefinition[] = [];
        for (const property of modelProperties(type)) {
          const propertyType = typeReference(program, diagnostics, property.type, property);
          if (propertyType !== undefined) {
            properties.push({
              name: property.name,
              optional: property.optional,
              type: propertyType,
            });
          }
        }
        return { kind: "object", properties };
      }
      diagnostics.unsupported(fullName(type), target);
      return undefined;
    case "Enum":
    case "Union":
      if (isNamedResourceType(type)) return { kind: "named", name: type.name };
      if (type.kind === "Union") {
        const nullable = isSafeUnionNullability(type);
        if (nullable === undefined) diagnostics.unsupported(fullName(type), target);
        const inner =
          nullable === undefined
            ? undefined
            : typeReference(program, diagnostics, nullable, target);
        return inner === undefined ? undefined : { kind: "nullable", type: inner };
      }
      diagnostics.unsupported(fullName(type), target);
      return undefined;
    case "Intrinsic":
      if (type.name === "null") return { kind: "literal", value: null };
      diagnostics.unsupported(type.name, target);
      return undefined;
    case "String":
      return { kind: "literal", value: type.value };
    case "Number":
      return { kind: "literal", value: type.value };
    case "Boolean":
      return { kind: "literal", value: type.value };
    default:
      diagnostics.unsupported(fullName(type), target);
      return undefined;
  }
};

const validateRecursiveShapes = (
  program: Program,
  diagnostics: EmitterDiagnostics,
  roots: readonly Type[],
): void => {
  const visiting = new Set<Type>();
  const visited = new Set<Type>();

  const visit = (type: Type, target: Type): void => {
    if (type.kind === "Model" && (isArrayModelType(type) || isRecordModelType(type))) {
      visit(type.indexer.value, target);
      return;
    }
    if (type.kind !== "Model" && type.kind !== "Union") return;
    if (!isNamedResourceType(type)) {
      if (type.kind === "Union") {
        const nullableMember = isSafeUnionNullability(type);
        if (nullableMember !== undefined) visit(nullableMember, target);
      }
      return;
    }
    if (visiting.has(type)) {
      diagnostics.recursive(fullName(type), target);
      return;
    }
    if (visited.has(type)) return;
    visiting.add(type);
    if (type.kind === "Model") {
      for (const property of modelProperties(type)) visit(property.type, property);
    } else {
      for (const variant of type.variants.values()) visit(variant.type, variant);
    }
    visiting.delete(type);
    visited.add(type);
  };

  for (const root of roots) visit(root, root);
  void program;
};

const collectReachableTypes = (operations: readonly Operation[]): readonly Type[] => {
  const values = new Set<Type>();
  const listener: SemanticNodeListener = {
    model: (model) => void values.add(model),
    scalar: (scalar) => void values.add(scalar),
    enum: (enumeration) => void values.add(enumeration),
    union: (union) => void values.add(union),
  };
  for (const operation of operations) {
    navigateType(operation.parameters, listener, {});
    navigateType(operation.returnType, listener, {});
  }
  return [...values];
};

const definitionsFor = (
  program: Program,
  diagnostics: EmitterDiagnostics,
  reachable: readonly Type[],
  parameterModels: ReadonlySet<Model>,
): Pick<SemanticManifest, "models" | "scalars" | "enums" | "unions"> => {
  const models: ModelDefinition[] = [];
  const scalars: ScalarDefinition[] = [];
  const enums: EnumDefinition[] = [];
  const unions: UnionDefinition[] = [];

  for (const type of reachable) {
    inspectDecorators(diagnostics, type);
    if (type.kind === "Model") {
      if (parameterModels.has(type)) continue;
      if (isArrayModelType(type) || isRecordModelType(type)) continue;
      if (!isNamedResourceType(type)) {
        if (platformPattern.test(fullName(type))) diagnostics.unsupported(fullName(type), type);
        continue;
      }
      if (platformPattern.test(fullName(type))) diagnostics.unsupported(fullName(type), type);
      const properties: ModelPropertyDefinition[] = [];
      for (const property of modelProperties(type)) {
        if (authorityFieldPattern.test(property.name)) {
          diagnostics.unsupported(`authority field ${property.name}`, property);
        }
        if (platformPattern.test(property.name)) {
          diagnostics.unsupported(`platform field ${property.name}`, property);
        }
        const propertyType = typeReference(program, diagnostics, property.type, property);
        if (propertyType !== undefined) {
          properties.push({ name: property.name, optional: property.optional, type: propertyType });
        }
      }
      checkNameCollection(diagnostics, properties, type);
      models.push({ name: type.name, properties });
    } else if (type.kind === "Scalar") {
      if (isBuiltInScalar(type)) continue;
      if (!isNamedResourceType(type)) {
        diagnostics.unsupported(fullName(type), type);
        continue;
      }
      scalars.push({
        name: type.name,
        base: scalarBaseName(type),
        constraints: constraintsFor(program, type),
      });
    } else if (type.kind === "Enum") {
      if (!isNamedResourceType(type)) {
        diagnostics.unsupported(fullName(type), type);
        continue;
      }
      const values = [...type.members.values()].map((member) => member.value ?? member.name);
      checkNameCollection(
        diagnostics,
        values.map((value) => ({ name: String(value) })),
        type,
      );
      enums.push({ name: type.name, values });
    } else if (type.kind === "Union") {
      if (!isNamedResourceType(type)) {
        if (isSafeUnionNullability(type) === undefined)
          diagnostics.unsupported(fullName(type), type);
        continue;
      }
      const variants: UnionVariantDefinition[] = [...type.variants.values()].map((variant) => {
        const variantType = typeReference(program, diagnostics, variant.type, variant);
        return {
          name: String(variant.name),
          type: variantType ?? { kind: "named", name: "<invalid>" },
        };
      });
      checkNameCollection(diagnostics, variants, type);
      unions.push({ name: type.name, variants });
    }
  }

  checkNameCollection(diagnostics, models, program.getGlobalNamespaceType());
  checkNameCollection(diagnostics, scalars, program.getGlobalNamespaceType());
  checkNameCollection(diagnostics, enums, program.getGlobalNamespaceType());
  checkNameCollection(diagnostics, unions, program.getGlobalNamespaceType());

  return { models, scalars, enums, unions };
};

const operationDefinitionsFor = (
  diagnostics: EmitterDiagnostics,
  namespace: Namespace,
): {
  readonly definitions: readonly OperationDefinition[];
  readonly operations: readonly Operation[];
} => {
  const actualNames = [...namespace.operations.keys()];
  const expectedNames: ReadonlySet<string> = new Set(externalOperationNames);
  for (const expected of externalOperationNames) {
    if (!namespace.operations.has(expected))
      diagnostics.operation(`missing operation ${expected}`, namespace);
  }
  for (const operation of namespace.operations.values()) {
    if (!expectedNames.has(operation.name))
      diagnostics.operation(`unexpected operation ${operation.name}`, operation);
  }
  if (actualNames.length !== externalOperationNames.length) {
    diagnostics.operation(
      `expected exactly ${externalOperationNames.length} operations`,
      namespace,
    );
  }
  const operations: Operation[] = [];
  const definitions: OperationDefinition[] = [];

  for (const name of canonicalOperationOrder) {
    const operation = namespace.operations.get(name);
    if (operation === undefined) continue;
    operations.push(operation);
    const requestParameter = operation.parameters.properties.get("request");
    if (requestParameter === undefined || operation.parameters.properties.size !== 1) {
      diagnostics.operation(`${name} must have exactly one request parameter`, operation);
      continue;
    }
    const requestType = requestParameter.type;
    const returnType = operation.returnType;
    if (requestType.kind !== "Model" || !isNamedResourceType(requestType)) {
      diagnostics.unsupported(`${name} request`, requestParameter);
      continue;
    }
    if (returnType.kind !== "Union" || !isNamedResourceType(returnType)) {
      diagnostics.unsupported(`${name} outcome`, operation);
      continue;
    }
    const success = returnType.variants.get("success")?.type;
    const failure = returnType.variants.get("failure")?.type;
    if (
      returnType.variants.size !== 2 ||
      success?.kind !== "Model" ||
      !isNamedResourceType(success) ||
      failure?.kind !== "Union" ||
      !isNamedResourceType(failure) ||
      failure.name !== "SafeFailure"
    ) {
      diagnostics.operation(`${name} outcome must be success plus SafeFailure`, operation);
      continue;
    }
    definitions.push({
      name,
      request: requestType.name,
      success: success.name,
      outcome: returnType.name,
      failure: failure.name,
    });
  }
  return { definitions, operations };
};

const validateSelectedEmitters = (context: EmitContext, diagnostics: EmitterDiagnostics): void => {
  for (const emitter of context.program.emitters) {
    const selected = emitter.metadata.name ?? emitter.main;
    if (selected !== emitterName)
      diagnostics.transport(selected, context.program.getGlobalNamespaceType());
  }
  for (const option of Object.keys(context.options)) {
    if (isTransportDecorator(option))
      diagnostics.transport(option, context.program.getGlobalNamespaceType());
  }
};

const buildProvenance = (context: EmitContext): ManifestProvenance => ({
  compilerVersion,
  emitterOptionsDigest: optionsDigestFor(context.options),
  emitterVersion,
  sourceDigest: sourceDigestFor(context.program),
});

const buildManifest = (
  context: EmitContext,
  diagnostics: EmitterDiagnostics,
): SemanticManifest | undefined => {
  const globalNamespace = context.program.getGlobalNamespaceType();
  const namespace = findNamespace(globalNamespace, resourceMasterNamespace);
  if (namespace === undefined) {
    diagnostics.metadata();
    return undefined;
  }
  const applications = getExternalContractApplications(context.program, namespace);
  const metadata = getExternalContractMetadata(context.program, namespace);
  if (
    applications.length !== 1 ||
    metadata === undefined ||
    metadata.identity.length === 0 ||
    metadata.compatibilityRevision.length === 0
  ) {
    diagnostics.metadata();
    return undefined;
  }

  const operationResult = operationDefinitionsFor(diagnostics, namespace);
  const reachable = collectReachableTypes(operationResult.operations);
  const parameterModels = new Set(
    operationResult.operations.map((operation) => operation.parameters),
  );
  validateRecursiveShapes(
    context.program,
    diagnostics,
    operationResult.operations
      .flatMap((operation) => [
        operation.parameters.properties.get("request")?.type,
        operation.returnType,
      ])
      .filter((type): type is Type => type !== undefined),
  );
  const definitions = definitionsFor(context.program, diagnostics, reachable, parameterModels);
  if (diagnostics.hasError) return undefined;

  return {
    externalContractIdentity: metadata.identity,
    compatibilityRevision: metadata.compatibilityRevision,
    schemaRevision: MANIFEST_SCHEMA_REVISION,
    provenance: buildProvenance(context),
    operations: operationResult.definitions,
    models: definitions.models,
    scalars: definitions.scalars,
    enums: definitions.enums,
    unions: definitions.unions,
  };
};

export async function $onEmit(context: EmitContext): Promise<void> {
  const diagnostics = diagnosticsFor(context.program);
  if (context.program.hasError()) return;
  try {
    validateSelectedEmitters(context, diagnostics);
    inspectProgramDecorators(context.program, diagnostics);
    const manifest = buildManifest(context, diagnostics);
    if (diagnostics.hasError || manifest === undefined) return;
    const content = serializeManifest(manifest);
    await emitFile(context.program, {
      path: resolvePath(context.emitterOutputDir, "semantic-manifest.json"),
      content,
      newLine: "lf",
    });
  } catch {
    diagnostics.failed();
  }
}

export { canonicalOperationOrder };
export {
  $externalContract,
  $onValidate,
  compatibilityRevision,
  externalContractIdentity,
  getExternalContractApplications,
  getExternalContractMetadata,
  resourceMasterNamespace,
} from "./decorators.ts";
export type { ExternalContractMetadata } from "./decorators.ts";
export { $lib, createDiagnostic, reportDiagnostic, StateKeys } from "./lib.ts";
export type { SemanticManifest } from "./manifest-model.ts";
