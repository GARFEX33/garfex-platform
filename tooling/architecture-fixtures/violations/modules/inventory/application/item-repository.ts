export interface ItemRepository {
  find(): Promise<string>;
}
