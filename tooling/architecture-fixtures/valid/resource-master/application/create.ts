import type { ResourceContract } from "../public.js";
import { canonicalValue } from "../domain/value.js";

export const create = (): ResourceContract => ({ resourceId: canonicalValue });
