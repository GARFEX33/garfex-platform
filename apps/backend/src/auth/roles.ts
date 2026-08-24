import type { Capability } from "../resource-master/public.js";

export const compositionRoleCapabilities = {
  Viewer: ["resource:read"],
  Editor: ["resource:read", "resource:create", "resource:update-non-identity"],
  Admin: [
    "resource:read",
    "resource:create",
    "resource:update-non-identity",
    "resource:deactivate",
  ],
} as const satisfies Readonly<Record<string, readonly Capability[]>>;

export type CompositionRole = keyof typeof compositionRoleCapabilities;

export const capabilitiesForRole = (role: CompositionRole): ReadonlySet<Capability> =>
  new Set(compositionRoleCapabilities[role]);
