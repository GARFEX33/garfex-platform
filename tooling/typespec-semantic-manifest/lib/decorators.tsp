import "../src/decorators.ts";

using TypeSpec.Reflection;

extern dec externalContract(
  target: Namespace,
  identity: valueof string,
  compatibilityRevision: valueof string,
);
