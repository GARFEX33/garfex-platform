import { access } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && specifier.endsWith(".js")) {
    const candidate = resolvePath(
      dirname(fileURLToPath(context.parentURL)),
      specifier.slice(0, -3) + ".ts",
    );
    try {
      await access(candidate);
      return { url: pathToFileURL(candidate).href, shortCircuit: true };
    } catch {
      // Let Node resolve external and generated JavaScript imports normally.
    }
  }
  return nextResolve(specifier, context);
}
