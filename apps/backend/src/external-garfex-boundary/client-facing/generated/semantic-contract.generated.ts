/* GENERATED FILE: derived from semantic-manifest.json; do not edit. */
/* Manifest digest: sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53 */

export const externalContractIdentity = "garfex.resource-master.external-client-contract" as const;
export const compatibilityRevision = "1" as const;
export const manifestDigest = "sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53" as const;
export const schemaRevision = 1 as const;

export const contractMetadata = {
  externalContractIdentity,
  compatibilityRevision,
  manifestDigest,
  schemaRevision,
} as const;

export const semanticManifest =
{
  "compatibilityRevision": "1",
  "enums": [
    {
      "name": "ApplicabilityMode",
      "values": [
        "FORBIDDEN",
        "NOT_APPLICABLE",
        "OPTIONAL",
        "REQUIRED"
      ]
    },
    {
      "name": "AttributeKind",
      "values": [
        "BOOLEAN",
        "CONTROLLED_OPTION",
        "CONTROLLED_TEXT",
        "DECIMAL",
        "INTEGER",
        "QUANTITY"
      ]
    },
    {
      "name": "ExternalFailureCode",
      "values": [
        "CATALOG_UNAVAILABLE",
        "CONFLICT",
        "DUPLICATE",
        "FORBIDDEN",
        "INTERNAL_FAILURE",
        "INVALID_ARGUMENT",
        "INVALID_LIFECYCLE",
        "INVALID_REFERENCE",
        "NOT_FOUND",
        "UNAUTHENTICATED",
        "VALIDATION_FAILED"
      ]
    },
    {
      "name": "FieldIssueReason",
      "values": [
        "CONFLICTING",
        "INVALID_FORMAT",
        "OUT_OF_RANGE",
        "REQUIRED",
        "UNSUPPORTED"
      ]
    },
    {
      "name": "IdentityPolicyVersion",
      "values": [
        "v1"
      ]
    },
    {
      "name": "ResourceLifecycleFilter",
      "values": [
        "ACTIVE",
        "ALL",
        "INACTIVE"
      ]
    }
  ],
  "externalContractIdentity": "garfex.resource-master.external-client-contract",
  "models": [
    {
      "name": "ApplicabilityResult",
      "properties": [
        {
          "name": "identity",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "boolean"
          }
        },
        {
          "name": "mode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ApplicabilityMode"
          }
        }
      ]
    },
    {
      "name": "ApplicabilityRule",
      "properties": [
        {
          "name": "result",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ApplicabilityResult"
          }
        },
        {
          "name": "when",
          "optional": false,
          "type": {
            "kind": "object",
            "properties": [
              {
                "name": "attributeCode",
                "optional": false,
                "type": {
                  "kind": "named",
                  "name": "NonEmptyCode"
                }
              },
              {
                "name": "optionCode",
                "optional": false,
                "type": {
                  "kind": "named",
                  "name": "NonEmptyCode"
                }
              }
            ]
          }
        }
      ]
    },
    {
      "name": "CatalogUnavailableFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "ConflictFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        },
        {
          "name": "currentRevision",
          "optional": true,
          "type": {
            "kind": "scalar",
            "name": "int32"
          }
        }
      ]
    },
    {
      "name": "CreateResourceRequest",
      "properties": [
        {
          "name": "attributes",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "ResourceAttribute"
            },
            "kind": "array"
          }
        },
        {
          "name": "classCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "familyCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "naturalUnitCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "typeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "CreateResourceSuccess",
      "properties": [
        {
          "name": "resource",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "Resource"
          }
        }
      ]
    },
    {
      "name": "DeactivateResourceRequest",
      "properties": [
        {
          "name": "expectedRevision",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "int32"
          }
        },
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "DeactivateResourceSuccess",
      "properties": [
        {
          "name": "resource",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "Resource"
          }
        }
      ]
    },
    {
      "name": "DescribeResourceRequest",
      "properties": [
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "DescribeResourceSuccess",
      "properties": [
        {
          "name": "description",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "DuplicateFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        },
        {
          "name": "existingResourceId",
          "optional": true,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "EffectiveAttribute",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "defaultResult",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ApplicabilityResult"
          }
        },
        {
          "name": "kind",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "AttributeKind"
          }
        },
        {
          "name": "meaning",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "name",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "rules",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "ApplicabilityRule"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "FieldIssue",
      "properties": [
        {
          "name": "field",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "reason",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "FieldIssueReason"
          }
        }
      ]
    },
    {
      "name": "ForbiddenFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "GetEffectiveResourceSchemaRequest",
      "properties": [
        {
          "name": "classCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "familyCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "typeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "GetEffectiveResourceSchemaSuccess",
      "properties": [
        {
          "name": "attributes",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "EffectiveAttribute"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "GetNaturalUnitsRequest",
      "properties": [
        {
          "name": "familyCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "GetNaturalUnitsSuccess",
      "properties": [
        {
          "name": "allowed",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "NaturalUnit"
            },
            "kind": "array"
          }
        },
        {
          "name": "suggested",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NaturalUnit"
          }
        }
      ]
    },
    {
      "name": "GetResourceRequest",
      "properties": [
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "GetResourceSuccess",
      "properties": [
        {
          "name": "resource",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "Resource"
          }
        }
      ]
    },
    {
      "name": "GetTaxonomyRequest",
      "properties": []
    },
    {
      "name": "GetTaxonomySuccess",
      "properties": [
        {
          "name": "items",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "Taxonomy"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "GetValidOptionsRequest",
      "properties": [
        {
          "name": "attributeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "GetValidOptionsSuccess",
      "properties": [
        {
          "name": "options",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "Option"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "InternalFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "InvalidArgumentFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        },
        {
          "name": "fieldIssues",
          "optional": true,
          "type": {
            "element": {
              "kind": "named",
              "name": "FieldIssue"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "InvalidLifecycleFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "InvalidReferenceFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        },
        {
          "name": "fieldIssues",
          "optional": true,
          "type": {
            "element": {
              "kind": "named",
              "name": "FieldIssue"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "NaturalUnit",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "name",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        }
      ]
    },
    {
      "name": "NotFoundFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "Option",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "label",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        }
      ]
    },
    {
      "name": "QuantityValue",
      "properties": [
        {
          "name": "magnitude",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "unitCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "Resource",
      "properties": [
        {
          "name": "active",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "boolean"
          }
        },
        {
          "name": "attributes",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "ResourceAttribute"
            },
            "kind": "array"
          }
        },
        {
          "name": "canonicalIdentity",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "classCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "familyCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "identityPolicyVersion",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "IdentityPolicyVersion"
          }
        },
        {
          "name": "naturalUnitCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        },
        {
          "name": "revision",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "int32"
          }
        },
        {
          "name": "typeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        }
      ]
    },
    {
      "name": "ResourceAttribute",
      "properties": [
        {
          "name": "attributeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "displayValue",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "identityParticipating",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "boolean"
          }
        },
        {
          "name": "value",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "AttributeValue"
          }
        }
      ]
    },
    {
      "name": "ResourceSummary",
      "properties": [
        {
          "name": "classCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "className",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "description",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "familyCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "familyName",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "naturalUnitCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "optionCodes",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "NonEmptyCode"
            },
            "kind": "array"
          }
        },
        {
          "name": "optionLabels",
          "optional": false,
          "type": {
            "element": {
              "kind": "scalar",
              "name": "string"
            },
            "kind": "array"
          }
        },
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        },
        {
          "name": "typeCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "typeName",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "values",
          "optional": false,
          "type": {
            "element": {
              "kind": "scalar",
              "name": "string"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "SearchResourcesRequest",
      "properties": [
        {
          "name": "cursor",
          "optional": true,
          "type": {
            "kind": "nullable",
            "type": {
              "kind": "scalar",
              "name": "string"
            }
          }
        },
        {
          "name": "lifecycle",
          "optional": true,
          "type": {
            "kind": "named",
            "name": "ResourceLifecycleFilter"
          }
        },
        {
          "name": "limit",
          "optional": true,
          "type": {
            "kind": "named",
            "name": "SearchLimit"
          }
        },
        {
          "name": "terms",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "SearchTerms"
          }
        }
      ]
    },
    {
      "name": "SearchResourcesSuccess",
      "properties": [
        {
          "name": "cursor",
          "optional": false,
          "type": {
            "kind": "nullable",
            "type": {
              "kind": "scalar",
              "name": "string"
            }
          }
        },
        {
          "name": "items",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "ResourceSummary"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "Taxonomy",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "families",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "TaxonomyFamily"
            },
            "kind": "array"
          }
        },
        {
          "name": "name",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        }
      ]
    },
    {
      "name": "TaxonomyFamily",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "name",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        },
        {
          "name": "types",
          "optional": false,
          "type": {
            "element": {
              "kind": "named",
              "name": "TaxonomyType"
            },
            "kind": "array"
          }
        }
      ]
    },
    {
      "name": "TaxonomyType",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "name",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        }
      ]
    },
    {
      "name": "UnauthenticatedFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        }
      ]
    },
    {
      "name": "UpdateNonIdentityDataRequest",
      "properties": [
        {
          "name": "expectedRevision",
          "optional": false,
          "type": {
            "kind": "scalar",
            "name": "int32"
          }
        },
        {
          "name": "naturalUnitCode",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "NonEmptyCode"
          }
        },
        {
          "name": "resourceId",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ResourceId"
          }
        }
      ]
    },
    {
      "name": "UpdateNonIdentityDataSuccess",
      "properties": [
        {
          "name": "resource",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "Resource"
          }
        }
      ]
    },
    {
      "name": "ValidationFailedFailure",
      "properties": [
        {
          "name": "code",
          "optional": false,
          "type": {
            "kind": "named",
            "name": "ExternalFailureCode"
          }
        },
        {
          "name": "fieldIssues",
          "optional": true,
          "type": {
            "element": {
              "kind": "named",
              "name": "FieldIssue"
            },
            "kind": "array"
          }
        }
      ]
    }
  ],
  "operations": [
    {
      "failure": "SafeFailure",
      "name": "getTaxonomy",
      "outcome": "GetTaxonomyOutcome",
      "request": "GetTaxonomyRequest",
      "success": "GetTaxonomySuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "getEffectiveResourceSchema",
      "outcome": "GetEffectiveResourceSchemaOutcome",
      "request": "GetEffectiveResourceSchemaRequest",
      "success": "GetEffectiveResourceSchemaSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "getValidOptions",
      "outcome": "GetValidOptionsOutcome",
      "request": "GetValidOptionsRequest",
      "success": "GetValidOptionsSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "getNaturalUnits",
      "outcome": "GetNaturalUnitsOutcome",
      "request": "GetNaturalUnitsRequest",
      "success": "GetNaturalUnitsSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "getResource",
      "outcome": "GetResourceOutcome",
      "request": "GetResourceRequest",
      "success": "GetResourceSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "searchResources",
      "outcome": "SearchResourcesOutcome",
      "request": "SearchResourcesRequest",
      "success": "SearchResourcesSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "describeResource",
      "outcome": "DescribeResourceOutcome",
      "request": "DescribeResourceRequest",
      "success": "DescribeResourceSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "createResource",
      "outcome": "CreateResourceOutcome",
      "request": "CreateResourceRequest",
      "success": "CreateResourceSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "updateNonIdentityData",
      "outcome": "UpdateNonIdentityDataOutcome",
      "request": "UpdateNonIdentityDataRequest",
      "success": "UpdateNonIdentityDataSuccess"
    },
    {
      "failure": "SafeFailure",
      "name": "deactivateResource",
      "outcome": "DeactivateResourceOutcome",
      "request": "DeactivateResourceRequest",
      "success": "DeactivateResourceSuccess"
    }
  ],
  "provenance": {
    "compilerVersion": "1.15.0",
    "emitterOptionsDigest": "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
    "emitterVersion": "0.1.0",
    "sourceDigest": "sha256:e439120afdee195bdb0aa672e75e3bc964c55fb948703a0196366aa7a920bcf0"
  },
  "scalars": [
    {
      "base": "string",
      "constraints": {
        "minLength": 1
      },
      "name": "NonEmptyCode"
    },
    {
      "base": "string",
      "constraints": {
        "minLength": 1
      },
      "name": "ResourceId"
    },
    {
      "base": "int32",
      "constraints": {
        "maxValue": 50,
        "minValue": 1
      },
      "name": "SearchLimit"
    },
    {
      "base": "string",
      "constraints": {
        "minLength": 1
      },
      "name": "SearchTerms"
    }
  ],
  "schemaRevision": 1,
  "unions": [
    {
      "name": "AttributeValue",
      "variants": [
        {
          "name": "flag",
          "type": {
            "kind": "scalar",
            "name": "boolean"
          }
        },
        {
          "name": "quantity",
          "type": {
            "kind": "named",
            "name": "QuantityValue"
          }
        },
        {
          "name": "text",
          "type": {
            "kind": "scalar",
            "name": "string"
          }
        }
      ]
    },
    {
      "name": "CreateResourceOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "CreateResourceSuccess"
          }
        }
      ]
    },
    {
      "name": "DeactivateResourceOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "DeactivateResourceSuccess"
          }
        }
      ]
    },
    {
      "name": "DescribeResourceOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "DescribeResourceSuccess"
          }
        }
      ]
    },
    {
      "name": "GetEffectiveResourceSchemaOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "GetEffectiveResourceSchemaSuccess"
          }
        }
      ]
    },
    {
      "name": "GetNaturalUnitsOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "GetNaturalUnitsSuccess"
          }
        }
      ]
    },
    {
      "name": "GetResourceOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "GetResourceSuccess"
          }
        }
      ]
    },
    {
      "name": "GetTaxonomyOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "GetTaxonomySuccess"
          }
        }
      ]
    },
    {
      "name": "GetValidOptionsOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "GetValidOptionsSuccess"
          }
        }
      ]
    },
    {
      "name": "SafeFailure",
      "variants": [
        {
          "name": "catalogUnavailable",
          "type": {
            "kind": "named",
            "name": "CatalogUnavailableFailure"
          }
        },
        {
          "name": "conflict",
          "type": {
            "kind": "named",
            "name": "ConflictFailure"
          }
        },
        {
          "name": "duplicate",
          "type": {
            "kind": "named",
            "name": "DuplicateFailure"
          }
        },
        {
          "name": "forbidden",
          "type": {
            "kind": "named",
            "name": "ForbiddenFailure"
          }
        },
        {
          "name": "internal",
          "type": {
            "kind": "named",
            "name": "InternalFailure"
          }
        },
        {
          "name": "invalidArgument",
          "type": {
            "kind": "named",
            "name": "InvalidArgumentFailure"
          }
        },
        {
          "name": "invalidLifecycle",
          "type": {
            "kind": "named",
            "name": "InvalidLifecycleFailure"
          }
        },
        {
          "name": "invalidReference",
          "type": {
            "kind": "named",
            "name": "InvalidReferenceFailure"
          }
        },
        {
          "name": "notFound",
          "type": {
            "kind": "named",
            "name": "NotFoundFailure"
          }
        },
        {
          "name": "unauthenticated",
          "type": {
            "kind": "named",
            "name": "UnauthenticatedFailure"
          }
        },
        {
          "name": "validationFailed",
          "type": {
            "kind": "named",
            "name": "ValidationFailedFailure"
          }
        }
      ]
    },
    {
      "name": "SearchResourcesOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "SearchResourcesSuccess"
          }
        }
      ]
    },
    {
      "name": "UpdateNonIdentityDataOutcome",
      "variants": [
        {
          "name": "failure",
          "type": {
            "kind": "named",
            "name": "SafeFailure"
          }
        },
        {
          "name": "success",
          "type": {
            "kind": "named",
            "name": "UpdateNonIdentityDataSuccess"
          }
        }
      ]
    }
  ]
} as const;

export const operations = semanticManifest.operations;
export const models = semanticManifest.models;
export const scalars = semanticManifest.scalars;
export const enums = semanticManifest.enums;
export const unions = semanticManifest.unions;

export type ExternalContractIdentity = typeof externalContractIdentity;
export type CompatibilityRevision = typeof compatibilityRevision;
export type GeneratedSemanticManifest = typeof semanticManifest;
export type GeneratedContractMetadata = typeof contractMetadata;
