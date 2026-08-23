/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Dependency cycles make module ownership and initialization order ambiguous.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-unresolved",
      severity: "error",
      comment: "Every import must resolve.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-non-package-json",
      severity: "error",
      comment: "External packages must be declared in package.json.",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg"] },
    },
    {
      name: "no-unknown-package-dependencies",
      severity: "error",
      comment: "External dependency classification must be unambiguous.",
      from: {},
      to: { dependencyTypes: ["npm-unknown"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.base.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs", ".json"],
    },
    reporterOptions: {
      dot: { collapsePattern: "node_modules/[^/]+" },
    },
  },
};
