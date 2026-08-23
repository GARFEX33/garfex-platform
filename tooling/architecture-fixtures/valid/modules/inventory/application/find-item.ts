import type { Item } from "../domain/item.js";
import type { ItemRepository } from "./ports/item-repository.js";

export type FindItem = (sku: string) => Promise<Item | undefined>;

export const makeFindItem =
  (repository: ItemRepository): FindItem =>
  async (sku) =>
    repository.findBySku(sku);
