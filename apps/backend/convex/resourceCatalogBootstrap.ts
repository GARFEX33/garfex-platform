import { internalMutation } from "./_generated/server.js";
import type { Infer } from "convex/values";
import { installArgsValidator, installResultValidator } from "./resourceCatalogValidators.js";
import { cableCatalogV1 } from "../src/resource-master/deployment/cable-catalog-v1.js";
import { ConvexResourceCatalogInstaller } from "../src/resource-master/infrastructure/convex-resource-catalog.js";

type InstallResult = Infer<typeof installResultValidator>;
type InstallerResult = Awaited<ReturnType<ConvexResourceCatalogInstaller["install"]>>;
type InstallerSnapshot = Extract<InstallerResult, { kind: "INSTALLED" }>["snapshot"];

const toTransportSnapshot = (snapshot: InstallerSnapshot) => ({
  catalogKey: snapshot.catalogKey,
  schemaVersion: snapshot.schemaVersion,
  sourceVersion: snapshot.sourceVersion,
  lifecycle: snapshot.lifecycle,
  revision: snapshot.revision,
  catalog: {
    classDefinition: { ...snapshot.catalog.classDefinition },
    family: {
      ...snapshot.catalog.family,
      allowedNaturalUnitCodes: [...snapshot.catalog.family.allowedNaturalUnitCodes],
    },
    type: { ...snapshot.catalog.type },
    attributes: snapshot.catalog.attributes.map((attribute) => ({ ...attribute })),
    optionSets: snapshot.catalog.optionSets.map((optionSet) => ({
      ...optionSet,
      options: optionSet.options.map((option) => ({ ...option })),
    })),
    naturalUnits: snapshot.catalog.naturalUnits.map((unit) => ({ ...unit })),
    bindings: snapshot.catalog.bindings.map((binding) => ({
      id: binding.id,
      scope: binding.scope,
      ownerCode: binding.ownerCode,
      attributeCode: binding.attributeCode,
      active: binding.active,
      defaultResult: { ...binding.defaultResult },
      rules: binding.rules.map((rule) => ({
        when: { ...rule.when },
        result: { ...rule.result },
      })),
      ...(binding.optionSetCode === undefined ? {} : { optionSetCode: binding.optionSetCode }),
      ...(binding.quantityUnitCodes === undefined
        ? {}
        : { quantityUnitCodes: [...binding.quantityUnitCodes] }),
      ...(binding.displayOrder === undefined ? {} : { displayOrder: binding.displayOrder }),
    })),
    presentation: {
      attributeOrder: [...snapshot.catalog.presentation.attributeOrder],
      includeNaturalUnit: snapshot.catalog.presentation.includeNaturalUnit,
    },
  },
});

const toTransportResult = (result: InstallerResult): InstallResult =>
  result.kind === "CONFLICT"
    ? result
    : { kind: result.kind, snapshot: toTransportSnapshot(result.snapshot) };

export const installCableCatalogV1 = internalMutation({
  args: installArgsValidator,
  returns: installResultValidator,
  handler: async (ctx, args) => {
    const result = await new ConvexResourceCatalogInstaller(ctx.db).install({
      expectedRevision: args.expectedRevision,
      candidate: cableCatalogV1,
    });
    return toTransportResult(result);
  },
});
