import "@garfex/typespec-semantic-manifest";

model NotANamespace {}

@externalContract("garfex.resource-master.external-client-contract", "1")
model WrongTarget {}
