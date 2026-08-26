import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@garfex/typespec-semantic-manifest",
  diagnostics: {
    "external-contract-metadata-count": {
      severity: "error",
      messages: {
        default:
          "external contract metadata must be applied exactly once to the resource-master namespace.",
      },
    },
    "external-contract-metadata-empty": {
      severity: "error",
      messages: {
        default: "external contract identity and compatibility revision must be non-empty.",
      },
    },
    "external-contract-metadata-target": {
      severity: "error",
      messages: {
        default: "external contract metadata must target the resource-master namespace.",
      },
    },
    "external-contract-metadata-invalid": {
      severity: "error",
      messages: {
        default: paramMessage`external contract metadata is invalid: ${"reason"}.`,
      },
    },
    "external-contract-operation-extra": {
      severity: "error",
      messages: {
        default: paramMessage`external contract operation "${"name"}" is not in the closed ten-operation set.`,
      },
    },
    "external-contract-operation-missing": {
      severity: "error",
      messages: {
        default: paramMessage`external contract operation "${"name"}" is missing from the closed ten-operation set.`,
      },
    },
    "external-contract-anonymous-shape": {
      severity: "error",
      messages: {
        default: paramMessage`external contract operation "${"name"}" must use named request and outcome shapes.`,
      },
    },
    "external-contract-authority-field": {
      severity: "error",
      messages: {
        default: paramMessage`external contract field "${"name"}" carries authority-bearing data.`,
      },
    },
    "external-contract-platform-leakage": {
      severity: "error",
      messages: {
        default: paramMessage`external contract declaration "${"name"}" leaks backend or platform semantics.`,
      },
    },
    "external-contract-emitter-metadata": {
      severity: "error",
      messages: {
        default:
          "semantic manifest metadata is missing, duplicated, empty, or targeted at the wrong namespace.",
      },
    },
    "external-contract-emitter-operation": {
      severity: "error",
      messages: {
        default: paramMessage`semantic manifest operation set is invalid: ${"reason"}.`,
      },
    },
    "external-contract-emitter-transport": {
      severity: "error",
      messages: {
        default: paramMessage`semantic manifest rejects transport-specific configuration or decorator "${"name"}".`,
      },
    },
    "external-contract-emitter-duplicate": {
      severity: "error",
      messages: {
        default: paramMessage`semantic manifest identifier "${"name"}" is duplicated after canonical normalization.`,
      },
    },
    "external-contract-emitter-unsupported": {
      severity: "error",
      messages: {
        default: paramMessage`semantic manifest cannot represent TypeSpec semantic shape "${"name"}".`,
      },
    },
    "external-contract-emitter-recursive": {
      severity: "error",
      messages: {
        default: paramMessage`semantic manifest cannot represent recursive runtime shape "${"name"}".`,
      },
    },
    "external-contract-emitter-failed": {
      severity: "error",
      messages: {
        default: "semantic manifest emission failed before output was written.",
      },
    },
  },
  state: {
    externalContract: { description: "External contract metadata applications." },
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
