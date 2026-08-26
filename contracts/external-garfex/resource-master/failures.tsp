namespace Garfex.External.ResourceMaster;

enum ExternalFailureCode {
  UNAUTHENTICATED,
  FORBIDDEN,
  INVALID_ARGUMENT,
  INVALID_REFERENCE,
  VALIDATION_FAILED,
  NOT_FOUND,
  DUPLICATE,
  CONFLICT,
  INVALID_LIFECYCLE,
  CATALOG_UNAVAILABLE,
  INTERNAL_FAILURE,
}

enum FieldIssueReason {
  REQUIRED,
  INVALID_FORMAT,
  OUT_OF_RANGE,
  UNSUPPORTED,
  CONFLICTING,
}

model FieldIssue {
  field: NonEmptyCode;
  reason: FieldIssueReason;
}

model UnauthenticatedFailure {
  code: ExternalFailureCode;
}

model ForbiddenFailure {
  code: ExternalFailureCode;
}

model InvalidArgumentFailure {
  code: ExternalFailureCode;
  fieldIssues?: FieldIssue[];
}

model InvalidReferenceFailure {
  code: ExternalFailureCode;
  fieldIssues?: FieldIssue[];
}

model ValidationFailedFailure {
  code: ExternalFailureCode;
  fieldIssues?: FieldIssue[];
}

model NotFoundFailure {
  code: ExternalFailureCode;
}

model DuplicateFailure {
  code: ExternalFailureCode;
  existingResourceId?: ResourceId;
}

model ConflictFailure {
  code: ExternalFailureCode;
  currentRevision?: int32;
}

model InvalidLifecycleFailure {
  code: ExternalFailureCode;
}

model CatalogUnavailableFailure {
  code: ExternalFailureCode;
}

model InternalFailure {
  code: ExternalFailureCode;
}

union SafeFailure {
  unauthenticated: UnauthenticatedFailure,
  forbidden: ForbiddenFailure,
  invalidArgument: InvalidArgumentFailure,
  invalidReference: InvalidReferenceFailure,
  validationFailed: ValidationFailedFailure,
  notFound: NotFoundFailure,
  duplicate: DuplicateFailure,
  conflict: ConflictFailure,
  invalidLifecycle: InvalidLifecycleFailure,
  catalogUnavailable: CatalogUnavailableFailure,
  internal: InternalFailure,
}
