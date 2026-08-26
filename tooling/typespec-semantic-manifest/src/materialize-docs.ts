import {
  canonicalizeManifest,
  type ModelDefinition,
  type SemanticManifest,
  type SemanticType,
  type UnionDefinition,
} from "./manifest-model.js";
import {
  assertMaterializableManifest,
  canonicalGeneratedText,
  manifestDigest,
} from "./materialize-common.js";

const markdown = (value: string): string => value.replaceAll("|", "\\|").replaceAll("`", "\\`");

const typeLabel = (type: SemanticType): string => {
  switch (type.kind) {
    case "array":
      return `Array<${typeLabel(type.element)}>`;
    case "literal":
      return JSON.stringify(type.value);
    case "object":
      return `{ ${type.properties.map(({ name, type: propertyType }) => `${name}: ${typeLabel(propertyType)}`).join("; ")} }`;
    case "named":
      return type.name;
    case "nullable":
      return `${typeLabel(type.type)} | null`;
    case "record":
      return `Record<string, ${typeLabel(type.value)}>`;
    case "scalar":
      return type.name;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
};

const modelByName = (manifest: SemanticManifest): ReadonlyMap<string, ModelDefinition> =>
  new Map(manifest.models.map((model) => [model.name, model]));

const modelFor = (
  models: ReadonlyMap<string, ModelDefinition>,
  name: string,
): ModelDefinition | undefined => models.get(name);

const fieldTable = (model: ModelDefinition | undefined): string[] => {
  if (model === undefined || model.properties.length === 0) return ["_No fields._", ""];
  return [
    "| Field | Required | Shape |",
    "| --- | --- | --- |",
    ...model.properties.map(
      ({ name, optional, type }) =>
        `| \`${markdown(name)}\` | ${optional ? "No" : "Yes"} | \`${markdown(typeLabel(type))}\` |`,
    ),
    "",
  ];
};

const operationSections = (
  manifest: SemanticManifest,
  models: ReadonlyMap<string, ModelDefinition>,
): string[] =>
  manifest.operations.flatMap((operation) => {
    const request = modelFor(models, operation.request);
    const success = modelFor(models, operation.success);
    return [
      `### \`${markdown(operation.name)}\``,
      "",
      `- Request model: \`${markdown(operation.request)}\``,
      `- Success model: \`${markdown(operation.success)}\``,
      `- Failure model: \`${markdown(operation.failure)}\``,
      "",
      "#### Request fields",
      "",
      ...fieldTable(request),
      "#### Success fields",
      "",
      ...fieldTable(success),
    ];
  });

const publicModelSections = (manifest: SemanticManifest): string[] =>
  manifest.models.flatMap((model) => [`### \`${markdown(model.name)}\``, "", ...fieldTable(model)]);

const namedTypeName = (type: SemanticType): string | undefined =>
  type.kind === "named" ? type.name : undefined;

const safeFailureSection = (manifest: SemanticManifest): string[] => {
  const failureUnionName = manifest.operations[0]?.failure;
  const failureUnion: UnionDefinition | undefined = manifest.unions.find(
    ({ name }) => name === failureUnionName,
  );
  const failureCodes = manifest.enums.find(({ values }) =>
    values.some((value) => String(value) === "INTERNAL_FAILURE"),
  );
  const models = modelByName(manifest);
  const rows =
    failureUnion?.variants.flatMap((variant) => {
      const modelName = namedTypeName(variant.type);
      const model = modelName === undefined ? undefined : models.get(modelName);
      const metadata =
        model?.properties
          .filter(({ name }) => name !== "code")
          .map(({ name }) => `\`${markdown(name)}\``)
          .join(", ") || "none";
      return [
        `| \`${markdown(variant.name)}\` | \`${markdown(modelName ?? typeLabel(variant.type))}\` | ${metadata} |`,
      ];
    }) ?? [];

  return [
    "## Safe failures",
    "",
    "A failure is one closed variant. The code values and optional corrective fields below are the complete reviewed failure surface.",
    "",
    "| Failure variant | Shape | Additional fields |",
    "| --- | --- | --- |",
    ...rows,
    "",
    "### Failure codes",
    "",
    ...(failureCodes?.values.map((value) => `- \`${markdown(String(value))}\``) ?? [
      "_No failure-code enum was emitted._",
    ]),
    "",
  ];
};

/**
 * Materialize standalone Markdown from the canonical manifest. No source file,
 * runtime module, or application model is consulted.
 */
export const materializeDocs = (manifest: SemanticManifest): string => {
  assertMaterializableManifest(manifest);
  const canonical = canonicalizeManifest(manifest);
  const models = modelByName(canonical);
  const source = [
    "# Contract identity and compatibility",
    "",
    "<!-- GENERATED FILE: derived from semantic-manifest.json; do not edit. -->",
    `<!-- Manifest digest: ${manifestDigest(canonical)} -->`,
    "",
    `- External contract identity: \`${markdown(canonical.externalContractIdentity)}\``,
    `- Compatibility revision: \`${markdown(canonical.compatibilityRevision)}\``,
    "",
    "The identity names one external contract lineage. The compatibility revision is an opaque string: compare it for exact equality and do not infer ordering, ranges, support duration, or a versioning policy.",
    "",
    "Only the business fields listed below are consumer input. Identity and access context are outside these values.",
    "",
    "## Consumer decision",
    "",
    "Use the named workflow request and read only the listed success fields. A consumer needs no implementation knowledge to interpret these business meanings.",
    "",
    "## Workflows",
    "",
    "Each workflow has a named request, success, and closed failure shape. The ten entries are emitted in the reviewed order from the manifest.",
    "",
    ...operationSections(canonical, models),
    "## Public UI-supporting metadata",
    "",
    "Taxonomy labels, effective attribute descriptions and constraints, option code/label pairs, and natural-unit choices are represented by the public models below. These projections contain only fields present in the manifest.",
    "",
    ...publicModelSections(canonical),
    ...safeFailureSection(canonical),
    "## Compatibility guidance",
    "",
    "The identity and compatibility revision are exact opaque values authored by the contract source. A consumer may compare each string for equality; it must not infer numeric ordering, semantic-version components, ranges, support duration, or rollout behavior.",
    "",
    "The manifest digest identifies the exact generated inputs for this document. If the digest or any generated value differs, regenerate from the current manifest rather than editing this document.",
  ].join("\n");
  return canonicalGeneratedText(source);
};

export type {
  MaterializationIssue,
  MaterializationIssueCode,
  MaterializedArtifact,
  MaterializedArtifacts,
} from "./materialize-common.js";
export {
  assertMaterializableManifest,
  canonicalGeneratedText,
  checkManifestDigest,
  manifestDigest,
  manifestSafetyIssues,
} from "./materialize-common.js";
