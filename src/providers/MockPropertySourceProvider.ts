import { mockDataset } from "../data/mockProperties";
import type { PropertyDataset } from "../domain/property";
import type { PropertySourceProvider } from "./PropertySourceProvider";

export class MockPropertySourceProvider implements PropertySourceProvider {
  async loadSampleDataset(): Promise<PropertyDataset> {
    return structuredClone(mockDataset);
  }
}
