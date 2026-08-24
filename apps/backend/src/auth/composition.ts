import type { Capability } from "../resource-master/public.js";
import type { IdentityAdapter } from "./identity-adapter.js";
import {
  LocalDevelopmentIdentityAdapter,
  localDevelopmentCapabilities,
} from "./local-development-identity-adapter.js";

export interface AuthenticationComposition {
  readonly identityAdapter: IdentityAdapter;
  readonly capabilities: ReadonlySet<Capability>;
}

export const createAuthenticationComposition = (
  identityAdapter: IdentityAdapter,
  capabilities: Iterable<Capability>,
): AuthenticationComposition => ({
  identityAdapter,
  capabilities: new Set(capabilities),
});

export const createConfiguredAuthenticationComposition = ({
  runtimeEnvironment,
  authMode,
}: {
  readonly runtimeEnvironment?: string | undefined;
  readonly authMode?: string | undefined;
}): AuthenticationComposition | null =>
  runtimeEnvironment === "local-development" && authMode === "local-development"
    ? createAuthenticationComposition(
        new LocalDevelopmentIdentityAdapter(),
        localDevelopmentCapabilities,
      )
    : null;
