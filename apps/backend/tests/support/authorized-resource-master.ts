import type {
  ActorContext,
  ActorId,
  Capability,
  ResourceMaster,
} from "../../src/resource-master/public.js";

export const fullyAuthorizedActor: ActorContext = {
  actorId: "garfex-actor:test-suite" as ActorId,
  capabilities: new Set<Capability>([
    "resource:read",
    "resource:create",
    "resource:update-non-identity",
    "resource:deactivate",
  ]),
};

type WithoutActor<Operation> = Operation extends (
  actor: ActorContext,
  ...input: infer Input
) => infer Output
  ? (...input: Input) => Output
  : never;

export type AuthorizedResourceMaster = {
  readonly [Operation in keyof ResourceMaster]: WithoutActor<ResourceMaster[Operation]>;
};

export const authorizeResourceMasterForTest = (master: ResourceMaster): AuthorizedResourceMaster =>
  new Proxy(master, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      return typeof value === "function"
        ? (...input: unknown[]) => value(fullyAuthorizedActor, ...input)
        : value;
    },
  }) as unknown as AuthorizedResourceMaster;
