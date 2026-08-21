import type { PropertyDataset } from "../domain/property";

export interface PropertySourceProvider {
  loadSampleDataset(): Promise<PropertyDataset>;
}
