import type { DecoratorContext, Namespace, Program, Type } from "@typespec/compiler";
import { reportDiagnostic, StateKeys } from "./lib.ts";

export const externalContractIdentity = "garfex.resource-master.external-client-contract";
export const compatibilityRevision = "1";
export const resourceMasterNamespace = "Garfex.External.ResourceMaster";
export const externalOperationNames = [
  "getTaxonomy",
  "getEffectiveResourceSchema",
  "getValidOptions",
  "getNaturalUnits",
  "getResource",
  "searchResources",
  "describeResource",
  "createResource",
  "updateNonIdentityData",
  "deactivateResource",
] as const;

export interface ExternalContractMetadata {
  readonly identity: string;
  readonly compatibilityRevision: string;
}

const namespaceName = (namespace: Namespace): string => {
  const parts: string[] = [];
  let current: Namespace | undefined = namespace;
  while (current !== undefined && current.name.length > 0) {
    parts.push(current.name);
    current = current.namespace;
  }
  return parts.reverse().join(".");
};

const findNamespace = (namespace: Namespace, expectedName: string): Namespace | undefined => {
  if (namespaceName(namespace) === expectedName) return namespace;
  for (const child of namespace.namespaces.values()) {
    const match = findNamespace(child, expectedName);
    if (match !== undefined) return match;
  }
  return undefined;
};

const walkNamespaces = function* (namespace: Namespace): Generator<Namespace> {
  yield namespace;
  for (const child of namespace.namespaces.values()) yield* walkNamespaces(child);
};

const namedDeclarationKinds: ReadonlySet<unknown> = new Set([13, 17, 19, 21]);

const isAnonymousShape = (type: Type): boolean =>
  type.node === undefined || !namedDeclarationKinds.has(type.node.kind);

const authorityFieldPattern = /^(actor|role|capabilit|claim|token|credential|session|provider)/i;
const platformPattern = /convex|backend|persistence|repository|deployment|platform/i;

const validateOperationSet = (program: Program, namespace: Namespace): void => {
  const expected = new Set<string>(externalOperationNames);
  const actual = new Set(namespace.operations.keys());

  for (const name of expected) {
    if (!actual.has(name)) {
      reportDiagnostic(program, {
        code: "external-contract-operation-missing",
        target: namespace,
        format: { name },
      });
    }
  }

  for (const operation of namespace.operations.values()) {
    if (!expected.has(operation.name)) {
      reportDiagnostic(program, {
        code: "external-contract-operation-extra",
        target: operation,
        format: { name: operation.name },
      });
      continue;
    }

    const requestType = operation.parameters.properties.get("request")?.type;
    if (
      (requestType !== undefined && isAnonymousShape(requestType)) ||
      isAnonymousShape(operation.returnType)
    ) {
      reportDiagnostic(program, {
        code: "external-contract-anonymous-shape",
        target: operation,
        format: { name: operation.name },
      });
    }
  }
};

const validatePublicDeclarations = (program: Program): void => {
  for (const namespace of walkNamespaces(program.getGlobalNamespaceType())) {
    for (const model of namespace.models.values()) {
      const declarationName = `${namespaceName(namespace)}.${model.name}`;
      if (platformPattern.test(declarationName)) {
        reportDiagnostic(program, {
          code: "external-contract-platform-leakage",
          target: model,
          format: { name: declarationName },
        });
      }
      for (const property of model.properties.values()) {
        if (authorityFieldPattern.test(property.name)) {
          reportDiagnostic(program, {
            code: "external-contract-authority-field",
            target: property,
            format: { name: property.name },
          });
        }
        if (platformPattern.test(property.name)) {
          reportDiagnostic(program, {
            code: "external-contract-platform-leakage",
            target: property,
            format: { name: property.name },
          });
        }
      }
    }
  }
};

export function $externalContract(
  context: DecoratorContext,
  target: Namespace,
  identity: string,
  compatibilityRevisionValue: string,
): void {
  if (identity.length === 0 || compatibilityRevisionValue.length === 0) {
    reportDiagnostic(context.program, {
      code: "external-contract-metadata-empty",
      target,
    });
  }

  const state = context.program.stateMap(StateKeys.externalContract);
  const previous = state.get(target) as ExternalContractMetadata[] | undefined;
  const applications = previous === undefined ? [] : [...previous];
  applications.push({ identity, compatibilityRevision: compatibilityRevisionValue });
  state.set(target, applications);
}

export function $onValidate(program: Program): void {
  const expected = findNamespace(program.getGlobalNamespaceType(), resourceMasterNamespace);
  const applications = [...program.stateMap(StateKeys.externalContract).entries()];
  const matching = applications.flatMap(([target, values]) =>
    target.kind === "Namespace" && namespaceName(target) === resourceMasterNamespace
      ? (values as ExternalContractMetadata[])
      : [],
  );

  if (matching.length !== 1 || expected === undefined) {
    reportDiagnostic(program, {
      code: "external-contract-metadata-count",
      target: expected ?? program.getGlobalNamespaceType(),
    });
  }

  for (const [target] of applications) {
    if (target.kind !== "Namespace" || namespaceName(target) !== resourceMasterNamespace) {
      reportDiagnostic(program, {
        code: "external-contract-metadata-target",
        target,
      });
    }
  }

  if (expected !== undefined && matching.length === 1) {
    validateOperationSet(program, expected);
    validatePublicDeclarations(program);
  }
}

export function getExternalContractMetadata(
  program: Program,
  target: Namespace,
): ExternalContractMetadata | undefined {
  const applications = program.stateMap(StateKeys.externalContract).get(target) as
    | ExternalContractMetadata[]
    | undefined;
  return applications?.length === 1 ? applications[0] : undefined;
}

export function getExternalContractApplications(
  program: Program,
  target: Namespace,
): readonly ExternalContractMetadata[] {
  const applications = program.stateMap(StateKeys.externalContract).get(target) as
    | ExternalContractMetadata[]
    | undefined;
  return applications ?? [];
}
