import {
  CanonicalizationError,
  canonicalizeValue,
  normalizeCode,
  normalizeSearchText,
} from "../domain/canonicalization.js";
import { createCanonicalIdentity } from "../domain/identity.js";
import {
  evaluateApplicability,
  resolveEffectiveBindings,
  SchemaIntegrityError,
} from "../domain/schema.js";
import type {
  ApplicabilityBinding,
  AttributeDefinition,
  PersistedAttribute,
  PersistedResource,
  ResourceCatalog,
} from "../domain/types.js";
import type {
  CreateResourceInput,
  ResourceError,
  ResourceMaster,
  ResourceSummary,
  ResourceView,
  Result,
} from "../public.js";
import {
  ResourceCatalogReadError,
  type ResourceCatalogReadCode,
  type ResourceCatalogReader,
} from "./ports/resource-catalog-reader.js";
import type { ResourceRepository } from "./ports/resource-repository.js";

interface Dependencies {
  readonly catalogReader: ResourceCatalogReader;
  readonly repository: ResourceRepository;
  readonly createResourceId?: () => string;
}

const success = <T>(value: T): Result<T> => ({ ok: true, value });
const failure = (
  code: ResourceError["code"],
  message: string,
  extra: Partial<ResourceError> = {},
): Result<never> => ({
  ok: false,
  error: { code, message, ...extra },
});
const catalogFailureMessages: Record<ResourceCatalogReadCode, string> = {
  RESOURCE_CATALOG_UNAVAILABLE: "resource catalog is unavailable",
  RESOURCE_CATALOG_UNINITIALIZED: "resource catalog is uninitialized",
  RESOURCE_CATALOG_INVALID: "resource catalog is invalid",
};

const viewResource = (resource: PersistedResource): ResourceView => ({
  resourceId: resource.resourceId,
  classCode: resource.classCode,
  familyCode: resource.familyCode,
  typeCode: resource.typeCode,
  naturalUnitCode: resource.naturalUnitCode,
  attributes: resource.attributes.map((attribute) => ({
    attributeCode: attribute.attributeCode,
    value: attribute.storedValue,
    displayValue: attribute.displayValue,
    identityParticipating: attribute.identityParticipating,
  })),
  canonicalIdentity: resource.canonicalIdentity,
  identityPolicyVersion: resource.identityPolicyVersion,
  active: resource.active,
  revision: resource.revision,
});

const optionFor = (
  catalog: ResourceCatalog,
  binding: ApplicabilityBinding,
  attribute: AttributeDefinition,
  code: string,
) => {
  const set = catalog.optionSets.find(
    (candidate) =>
      candidate.code === binding.optionSetCode &&
      candidate.attributeCode === attribute.code &&
      candidate.active,
  );
  return set?.options.find((option) => option.code === code && option.active);
};

const taxonomyIsValid = (
  catalog: ResourceCatalog,
  input: Pick<CreateResourceInput, "classCode" | "familyCode" | "typeCode">,
) =>
  catalog.classDefinition.active &&
  catalog.family.active &&
  catalog.type.active &&
  input.classCode === catalog.classDefinition.code &&
  input.familyCode === catalog.family.code &&
  input.typeCode === catalog.type.code &&
  catalog.family.classCode === catalog.classDefinition.code &&
  catalog.type.familyCode === catalog.family.code;

const describe = (catalog: ResourceCatalog, resource: PersistedResource): string => {
  const effectiveBindings = new Map(
    resolveEffectiveBindings(catalog.bindings, catalog.family.code, catalog.type.code).map(
      (binding) => [binding.attributeCode, binding] as const,
    ),
  );
  const attributes = new Map(
    resource.attributes.map((attribute) => [attribute.attributeCode, attribute]),
  );
  const parts = [catalog.type.name];
  for (const code of catalog.presentation.attributeOrder) {
    const attribute = attributes.get(code);
    if (attribute === undefined) continue;
    const definition = catalog.attributes.find((candidate) => candidate.code === code);
    const binding = effectiveBindings.get(code);
    if (definition?.kind === "CONTROLLED_OPTION" && binding !== undefined) {
      const option = optionFor(catalog, binding, definition, attribute.canonicalIdentity);
      parts.push(option?.label ?? attribute.displayValue);
    } else if (code === "gauge") {
      parts.push(`${attribute.displayValue} AWG`);
    } else {
      parts.push(attribute.displayValue);
    }
  }
  if (catalog.presentation.includeNaturalUnit) parts.push(resource.naturalUnitCode);
  return parts.join(" ");
};

const summary = (catalog: ResourceCatalog, resource: PersistedResource): ResourceSummary => {
  const effectiveBindings = new Map(
    resolveEffectiveBindings(catalog.bindings, catalog.family.code, catalog.type.code).map(
      (binding) => [binding.attributeCode, binding] as const,
    ),
  );
  const options = resource.attributes.flatMap((attribute) => {
    const definition = catalog.attributes.find(
      (candidate) => candidate.code === attribute.attributeCode,
    );
    const binding = effectiveBindings.get(attribute.attributeCode);
    const option =
      definition?.kind === "CONTROLLED_OPTION" && binding !== undefined
        ? optionFor(catalog, binding, definition, attribute.canonicalIdentity)
        : undefined;
    return option === undefined ? [] : [option];
  });
  return {
    resourceId: resource.resourceId,
    classCode: resource.classCode,
    className: catalog.classDefinition.name,
    familyCode: resource.familyCode,
    familyName: catalog.family.name,
    typeCode: resource.typeCode,
    typeName: catalog.type.name,
    naturalUnitCode: resource.naturalUnitCode,
    description: describe(catalog, resource),
    optionCodes: options.map((option) => option.code),
    optionLabels: options.map((option) => option.label),
    values: resource.attributes.map((attribute) => attribute.displayValue),
  };
};

const searchProjectionFor = (catalog: ResourceCatalog, resource: PersistedResource): string => {
  const naturalUnit = catalog.naturalUnits.find((unit) => unit.code === resource.naturalUnitCode);
  return normalizeSearchText(
    [
      catalog.classDefinition.code,
      catalog.classDefinition.name,
      catalog.family.code,
      catalog.family.name,
      catalog.type.code,
      catalog.type.name,
      resource.naturalUnitCode,
      naturalUnit?.name ?? "",
      describe(catalog, resource),
      ...resource.attributes.flatMap((attribute) => [
        attribute.attributeCode,
        attribute.canonicalIdentity,
        attribute.displayValue,
      ]),
    ].join(" "),
  );
};

type Lifecycle = Parameters<ResourceRepository["listPage"]>[0]["lifecycle"];

const encodeCursor = (
  lifecycle: Lifecycle,
  normalizedTerms: string,
  lastScannedResourceId: string,
): string =>
  `v2|${lifecycle}|${encodeURIComponent(normalizedTerms)}|${encodeURIComponent(lastScannedResourceId)}`;

const decodeCursor = (
  cursor: string | null | undefined,
  lifecycle: Lifecycle,
  normalizedTerms: string,
): { readonly afterResourceId?: string } | null => {
  if (cursor === undefined || cursor === null) return {};
  const parts = cursor.split("|");
  if (parts.length !== 4 || parts[0] !== "v2" || parts[1] !== lifecycle) return null;
  const encodedTerms = parts[2];
  const encodedResourceId = parts[3];
  if (encodedTerms === undefined || encodedResourceId === undefined) return null;
  try {
    const decodedTerms = decodeURIComponent(encodedTerms);
    const afterResourceId = decodeURIComponent(encodedResourceId);
    if (
      encodeURIComponent(decodedTerms) !== encodedTerms ||
      encodeURIComponent(afterResourceId) !== encodedResourceId ||
      decodedTerms !== normalizedTerms ||
      afterResourceId.length === 0
    ) {
      return null;
    }
    return { afterResourceId };
  } catch {
    return null;
  }
};

export const createResourceMaster = ({
  catalogReader,
  repository,
  createResourceId,
}: Dependencies): ResourceMaster => {
  const effectiveBindings = (catalog: ResourceCatalog) =>
    resolveEffectiveBindings(catalog.bindings, catalog.family.code, catalog.type.code);
  const withCatalog = async (): Promise<Result<ResourceCatalog>> => {
    try {
      return success((await catalogReader.loadSnapshot()).catalog);
    } catch (error) {
      const code: ResourceCatalogReadCode =
        error instanceof ResourceCatalogReadError ? error.code : "RESOURCE_CATALOG_UNAVAILABLE";
      return failure(code, catalogFailureMessages[code]);
    }
  };

  return {
    async getTaxonomy() {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      return success([
        {
          code: catalog.classDefinition.code,
          name: catalog.classDefinition.name,
          families: [
            {
              code: catalog.family.code,
              name: catalog.family.name,
              types: [{ code: catalog.type.code, name: catalog.type.name }],
            },
          ],
        },
      ]);
    },

    async getEffectiveResourceSchema(input) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      if (!taxonomyIsValid(catalog, input))
        return failure("INVALID_REFERENCE", "unknown taxonomy path");
      try {
        const attributes = effectiveBindings(catalog).flatMap((binding) => {
          const definition = catalog.attributes.find(
            (attribute) => attribute.code === binding.attributeCode,
          );
          return definition === undefined
            ? []
            : [
                {
                  code: definition.code,
                  name: definition.name,
                  kind: definition.kind,
                  meaning: definition.meaning,
                  defaultResult: binding.defaultResult,
                  rules: binding.rules.map((rule) => ({
                    when: { ...rule.when },
                    result: { ...rule.result },
                  })),
                },
              ];
        });
        return success({ attributes });
      } catch (error) {
        return error instanceof SchemaIntegrityError
          ? failure("INTEGRITY", error.message)
          : failure("INTERNAL", "resource schema resolution failed");
      }
    },

    async getValidOptions({ attributeCode }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      const attribute = catalog.attributes.find(
        (candidate) => candidate.code === attributeCode && candidate.active,
      );
      if (attribute === undefined) return failure("NOT_FOUND", "attribute not found");
      try {
        const binding = effectiveBindings(catalog).find(
          (candidate) => candidate.attributeCode === attribute.code,
        );
        if (binding === undefined) return failure("NOT_FOUND", "attribute is not applicable");
        const set = catalog.optionSets.find(
          (candidate) =>
            candidate.attributeCode === attribute.code &&
            candidate.code === binding.optionSetCode &&
            candidate.active,
        );
        if (set === undefined) return failure("NOT_FOUND", "attribute has no controlled options");
        return success(
          set.options.filter((option) => option.active).map(({ code, label }) => ({ code, label })),
        );
      } catch (error) {
        return error instanceof SchemaIntegrityError
          ? failure("INTEGRITY", error.message)
          : failure("INTERNAL", "option resolution failed");
      }
    },

    async getNaturalUnits({ familyCode }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      if (familyCode !== catalog.family.code || !catalog.family.active) {
        return failure("INVALID_REFERENCE", "family not found");
      }
      const allowed = catalog.naturalUnits.filter(
        (unit) => unit.active && catalog.family.allowedNaturalUnitCodes.includes(unit.code),
      );
      const suggested = allowed.find(
        (unit) => unit.code === catalog.family.suggestedNaturalUnitCode,
      );
      if (suggested === undefined)
        return failure("INTEGRITY", "suggested natural unit is not allowed");
      return success({
        allowed: allowed.map(({ code, name }) => ({ code, name })),
        suggested: { code: suggested.code, name: suggested.name },
      });
    },

    async createResource(input) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      try {
        const codes = {
          classCode: normalizeCode(input.classCode),
          familyCode: normalizeCode(input.familyCode),
          typeCode: normalizeCode(input.typeCode),
        };
        if (!taxonomyIsValid(catalog, codes))
          return failure("INVALID_REFERENCE", "unknown taxonomy path");
        if (
          typeof input.naturalUnitCode !== "string" ||
          input.naturalUnitCode.trim().length === 0
        ) {
          return failure("VALIDATION", "naturalUnitCode is required");
        }
        const naturalUnitCode = normalizeCode(input.naturalUnitCode);
        const naturalUnit = catalog.naturalUnits.find((unit) => unit.code === naturalUnitCode);
        if (
          naturalUnit?.active !== true ||
          !catalog.family.allowedNaturalUnitCodes.includes(naturalUnitCode)
        ) {
          return failure("INVALID_REFERENCE", "natural unit is inactive, missing, or not allowed");
        }
        if (typeof input.attributes !== "object" || input.attributes === null) {
          return failure("INVALID_ARGUMENT", "attributes must be an object");
        }
        const knownCodes = new Set(catalog.attributes.map((attribute) => attribute.code));
        const unknown = Object.keys(input.attributes).filter((code) => !knownCodes.has(code));
        if (unknown.length > 0) {
          return failure("VALIDATION", "unknown attributes", { details: unknown.sort() });
        }

        const bindings = effectiveBindings(catalog);
        const bindingByAttribute = new Map(
          bindings.map((binding) => [binding.attributeCode, binding] as const),
        );
        const canonical = new Map<string, ReturnType<typeof canonicalizeValue>>();
        for (const definition of catalog.attributes) {
          const raw = input.attributes[definition.code];
          if (raw === undefined) continue;
          if (!definition.active)
            return failure("INVALID_REFERENCE", `attribute ${definition.code} is inactive`);
          const value = canonicalizeValue(definition.kind, raw);
          const binding = bindingByAttribute.get(definition.code);
          if (binding === undefined) {
            return failure("VALIDATION", `attribute ${definition.code} is not applicable`);
          }
          if (definition.kind === "CONTROLLED_OPTION") {
            const option = optionFor(catalog, binding, definition, value.identity);
            if (option === undefined) {
              return failure("INVALID_REFERENCE", `invalid option for ${definition.code}`);
            }
            canonical.set(definition.code, { ...value, display: option.label });
          } else if (definition.kind === "QUANTITY") {
            const unitCode = typeof value.stored === "object" ? value.stored.unitCode : "";
            if (!binding.quantityUnitCodes?.includes(unitCode)) {
              return failure("INVALID_REFERENCE", `invalid quantity unit for ${definition.code}`);
            }
            canonical.set(definition.code, value);
          } else {
            canonical.set(definition.code, value);
          }
        }
        const canonicalOptions = Object.fromEntries(
          catalog.attributes
            .filter((definition) => definition.kind === "CONTROLLED_OPTION")
            .flatMap((definition) => {
              const value = canonical.get(definition.code);
              return value === undefined ? [] : [[definition.code, value.identity] as const];
            }),
        );
        const persistedAttributes: PersistedAttribute[] = [];
        for (const binding of bindings) {
          const result = evaluateApplicability(binding, canonicalOptions);
          if ("kind" in result)
            return failure("INTEGRITY", `ambiguous applicability for ${binding.attributeCode}`);
          const value = canonical.get(binding.attributeCode);
          if (result.mode === "REQUIRED" && value === undefined) {
            return failure("VALIDATION", `required attribute ${binding.attributeCode} is missing`);
          }
          if (
            (result.mode === "FORBIDDEN" || result.mode === "NOT_APPLICABLE") &&
            value !== undefined
          ) {
            return failure(
              "VALIDATION",
              `${binding.attributeCode} cannot have a payload when ${result.mode}`,
            );
          }
          if (value === undefined) continue;
          const definition = catalog.attributes.find(
            (attribute) => attribute.code === binding.attributeCode,
          );
          if (definition === undefined)
            return failure("INTEGRITY", "binding references missing attribute");
          persistedAttributes.push({
            attributeCode: definition.code,
            kind: definition.kind,
            canonicalIdentity: value.identity,
            displayValue: value.display,
            storedValue: value.stored,
            identityParticipating: result.identity,
          });
        }
        const resourceBase = {
          classCode: codes.classCode,
          familyCode: codes.familyCode,
          typeCode: codes.typeCode,
          attributes: persistedAttributes,
        };
        const canonicalIdentity = createCanonicalIdentity(resourceBase);
        const provisional: PersistedResource = {
          resourceId: createResourceId?.() ?? globalThis.crypto.randomUUID(),
          ...resourceBase,
          naturalUnitCode,
          canonicalIdentity,
          identityPolicyVersion: "v1",
          active: true,
          revision: 1,
          searchProjection: "",
        };
        const searchProjection = searchProjectionFor(catalog, provisional);
        const resource = { ...provisional, searchProjection };
        const persisted = await repository.createIfIdentityAbsent(resource);
        if (persisted.kind === "DUPLICATE") {
          return failure("DUPLICATE", "an equivalent active resource already exists", {
            existingResourceId: persisted.existingResourceId,
          });
        }
        return success(viewResource(resource));
      } catch (error) {
        if (error instanceof CanonicalizationError) {
          return failure("VALIDATION", "resource input could not be canonicalized");
        }
        return error instanceof SchemaIntegrityError
          ? failure("INTEGRITY", error.message)
          : failure("INTERNAL", "resource creation failed");
      }
    },

    async updateNonIdentityData({ resourceId, expectedRevision, naturalUnitCode: rawUnit }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      if (
        typeof resourceId !== "string" ||
        resourceId.length === 0 ||
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 0
      ) {
        return failure("INVALID_ARGUMENT", "resourceId and a non-negative revision are required");
      }
      if (typeof rawUnit !== "string" || rawUnit.trim().length === 0) {
        return failure("VALIDATION", "naturalUnitCode is required");
      }
      const naturalUnitCode = normalizeCode(rawUnit);
      const naturalUnit = catalog.naturalUnits.find((unit) => unit.code === naturalUnitCode);
      if (
        naturalUnit?.active !== true ||
        !catalog.family.allowedNaturalUnitCodes.includes(naturalUnitCode)
      ) {
        return failure("INVALID_REFERENCE", "natural unit is inactive, missing, or not allowed");
      }
      const result = await repository.updateNaturalUnit({
        resourceId,
        expectedRevision,
        naturalUnitCode,
        searchProjection: (resource) => searchProjectionFor(catalog, resource),
      });
      if (result.kind === "UPDATED") return success(viewResource(result.resource));
      if (result.kind === "CONFLICT") {
        return failure("CONFLICT", "resource revision does not match", {
          currentRevision: result.currentRevision,
        });
      }
      if (result.kind === "INVALID_LIFECYCLE") {
        return failure("INVALID_LIFECYCLE", "inactive resources cannot be updated");
      }
      return failure("NOT_FOUND", "resource not found");
    },

    async deactivateResource({ resourceId, expectedRevision }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      if (
        typeof resourceId !== "string" ||
        resourceId.length === 0 ||
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 0
      ) {
        return failure("INVALID_ARGUMENT", "resourceId and a non-negative revision are required");
      }
      const result = await repository.deactivate({ resourceId, expectedRevision });
      if (result.kind === "UPDATED") return success(viewResource(result.resource));
      if (result.kind === "CONFLICT") {
        return failure("CONFLICT", "resource revision does not match", {
          currentRevision: result.currentRevision,
        });
      }
      if (result.kind === "INVALID_LIFECYCLE") {
        return failure("INVALID_LIFECYCLE", "resource is already inactive");
      }
      return failure("NOT_FOUND", "resource not found");
    },

    async getResource({ resourceId }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      if (typeof resourceId !== "string" || resourceId.length === 0) {
        return failure("INVALID_ARGUMENT", "resourceId is required");
      }
      const resource = await repository.getByResourceId(resourceId);
      return resource === null
        ? failure("NOT_FOUND", "resource not found")
        : success(viewResource(resource));
    },

    async searchResources({ terms, lifecycle = "ACTIVE", limit = 20, cursor }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return failure("INVALID_ARGUMENT", "limit must be an integer from 1 to 50");
      }
      const normalizedTerms = typeof terms === "string" ? normalizeSearchText(terms) : "";
      if (normalizedTerms.length === 0) {
        return failure("INVALID_ARGUMENT", "at least one search term is required");
      }
      if (!(["ACTIVE", "INACTIVE", "ALL"] as const).includes(lifecycle)) {
        return failure("INVALID_ARGUMENT", "invalid lifecycle filter");
      }
      const position = decodeCursor(cursor, lifecycle, normalizedTerms);
      if (position === null) return failure("INVALID_ARGUMENT", "invalid cursor");
      const tokens = normalizedTerms.split(" ");
      const items: ResourceSummary[] = [];
      let afterResourceId = position.afterResourceId;

      while (items.length < limit) {
        const page = await repository.listPage({
          lifecycle,
          ...(afterResourceId === undefined ? {} : { afterResourceId }),
          limit: 200,
        });
        for (const [index, resource] of page.resources.entries()) {
          afterResourceId = resource.resourceId;
          const matches = tokens.every((token) =>
            resource.searchProjection.split(" ").some((candidate) => candidate.startsWith(token)),
          );
          if (matches) items.push(summary(catalog, resource));
          if (items.length === limit) {
            const hasMore = index + 1 < page.resources.length || page.hasMore;
            return success({
              items,
              cursor: hasMore
                ? encodeCursor(lifecycle, normalizedTerms, resource.resourceId)
                : null,
            });
          }
        }
        if (!page.hasMore) return success({ items, cursor: null });
        if (page.lastScannedResourceId === null) {
          return failure("INTERNAL", "resource repository returned an invalid page");
        }
        afterResourceId = page.lastScannedResourceId;
      }

      return success({ items, cursor: null });
    },

    async describeResource({ resourceId }) {
      const catalogResult = await withCatalog();
      if (!catalogResult.ok) return catalogResult;
      const catalog = catalogResult.value;
      const resource = await repository.getByResourceId(resourceId);
      if (resource === null) return failure("NOT_FOUND", "resource not found");
      return success({ resourceId, description: describe(catalog, resource) });
    },
  };
};
