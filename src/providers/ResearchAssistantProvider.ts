import type { PropertyFilters } from "../domain/filters";
import type { PropertyWithSnapshots } from "../domain/property";
import type { PropertyComparison } from "../domain/propertyDiff";

export type ResearchIntent = "summarize_changes" | "price_down" | "layout_filter" | "price_walk_filter" | "cheaper_than_target" | "station_appeal" | "price_appeal" | "appeal_changed" | "unsupported";
export type ResearchAssistantRequest = {
  message: string;
  targetProperty: PropertyWithSnapshots;
  competitors: PropertyWithSnapshots[];
  comparisons: PropertyComparison[];
};
export type ResearchAssistantResponse = {
  message: string;
  matchedPropertyIds: string[];
  filterAction?: Partial<PropertyFilters>;
  intent: ResearchIntent;
};
export interface ResearchAssistantProvider {
  answer(request: ResearchAssistantRequest): Promise<ResearchAssistantResponse>;
}
