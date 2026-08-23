import type { AttributeKind, CanonicalValue } from "./types.js";

export class CanonicalizationError extends Error {}

const canonicalDecimal = (input: unknown, integer: boolean): string => {
  if (typeof input !== "string" && typeof input !== "number") {
    throw new CanonicalizationError("numeric value must be a string or number");
  }
  const raw = String(input);
  const expression = integer ? /^[+-]?\d+$/ : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (!expression.test(raw)) throw new CanonicalizationError("invalid exact numeric value");
  const negative = raw.startsWith("-");
  const unsigned = raw.replace(/^[+-]/, "");
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.replace(/0+$/, "");
  const magnitude = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative && magnitude !== "0" ? `-${magnitude}` : magnitude;
};

const normalizedText = (input: unknown): string => {
  if (typeof input !== "string") throw new CanonicalizationError("text value must be a string");
  const value = input.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (value.length === 0) throw new CanonicalizationError("text value cannot be empty");
  return value;
};

export const normalizeCode = (input: unknown): string =>
  normalizedText(input).toLocaleUpperCase("und");

export const normalizeSearchText = (input: string): string =>
  input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("und")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

export const canonicalizeValue = (kind: AttributeKind, input: unknown): CanonicalValue => {
  switch (kind) {
    case "CONTROLLED_OPTION": {
      const value = normalizeCode(input);
      return { identity: value, display: value, stored: value };
    }
    case "INTEGER": {
      const value = canonicalDecimal(input, true);
      return { identity: value, display: value, stored: value };
    }
    case "DECIMAL": {
      if (typeof input !== "string") {
        throw new CanonicalizationError("exact decimal value must be a string");
      }
      const value = canonicalDecimal(input, false);
      return { identity: value, display: value, stored: value };
    }
    case "BOOLEAN": {
      if (typeof input !== "boolean")
        throw new CanonicalizationError("boolean must be true or false");
      return { identity: String(input), display: String(input), stored: input };
    }
    case "CONTROLLED_TEXT": {
      const display = normalizedText(input);
      return { identity: display.toLocaleLowerCase("und"), display, stored: display };
    }
    case "QUANTITY": {
      if (
        typeof input !== "object" ||
        input === null ||
        !("magnitude" in input) ||
        !("unitCode" in input)
      ) {
        throw new CanonicalizationError("quantity needs magnitude and unitCode");
      }
      const quantity = input as { readonly magnitude: unknown; readonly unitCode: unknown };
      if (typeof quantity.magnitude !== "string") {
        throw new CanonicalizationError("exact quantity magnitude must be a string");
      }
      const magnitude = canonicalDecimal(quantity.magnitude, false);
      const unitCode = normalizeCode(quantity.unitCode);
      return {
        identity: `${magnitude} ${unitCode}`,
        display: `${magnitude} ${unitCode}`,
        stored: { magnitude, unitCode },
      };
    }
    default: {
      const exhaustive: never = kind;
      throw new CanonicalizationError(`unsupported attribute kind: ${exhaustive}`);
    }
  }
};
