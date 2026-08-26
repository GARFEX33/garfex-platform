namespace Garfex.External.ResourceMaster;

model FixtureRequest {}
model FixtureOutcome {}

op getTaxonomy(request: FixtureRequest): FixtureOutcome;
op getEffectiveResourceSchema(request: FixtureRequest): FixtureOutcome;
op getValidOptions(request: FixtureRequest): FixtureOutcome;
op getNaturalUnits(request: FixtureRequest): FixtureOutcome;
op getResource(request: FixtureRequest): FixtureOutcome;
op searchResources(request: FixtureRequest): FixtureOutcome;
op describeResource(request: FixtureRequest): FixtureOutcome;
op createResource(request: FixtureRequest): FixtureOutcome;
op updateNonIdentityData(request: FixtureRequest): FixtureOutcome;
op deactivateResource(request: FixtureRequest): FixtureOutcome;
