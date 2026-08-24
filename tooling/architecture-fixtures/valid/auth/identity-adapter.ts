export interface IdentityAdapter {
  resolveActorId(): Promise<string | null>;
}
