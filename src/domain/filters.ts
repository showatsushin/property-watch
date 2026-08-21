import type { Property, PropertySnapshot, PropertyType, TransactionType } from "./property";
import type { PropertyComparison } from "./propertyDiff";

export type PropertyFilters = {
  priceBand: "all" | "under5000" | "5000s" | "6000plus";
  layout: string;
  minArea: number;
  maxWalkMinutes: number;
  salePhase: string;
  changedOnly: boolean;
  transactionType: "all" | TransactionType;
  propertyType: "all" | PropertyType;
};

export const defaultFilters: PropertyFilters = {
  priceBand: "all",
  layout: "all",
  minArea: 0,
  maxWalkMinutes: 20,
  salePhase: "all",
  changedOnly: false,
  transactionType: "all",
  propertyType: "all",
};

export function matchesFilters(
  property: Property,
  snapshot: PropertySnapshot,
  comparison: PropertyComparison,
  filters: PropertyFilters,
) {
  const priceMatches = filters.priceBand === "all"
    || (filters.priceBand === "under5000" && snapshot.minPrice < 5000)
    || (filters.priceBand === "5000s" && snapshot.minPrice >= 5000 && snapshot.minPrice < 6000)
    || (filters.priceBand === "6000plus" && snapshot.minPrice >= 6000);
  return priceMatches
    && (filters.layout === "all" || snapshot.layouts.includes(filters.layout))
    && snapshot.maxArea >= filters.minArea
    && property.walkMinutes <= filters.maxWalkMinutes
    && (filters.salePhase === "all" || snapshot.salePhase === filters.salePhase)
    && (!filters.changedOnly || comparison.hasChanges)
    && (filters.transactionType === "all" || property.transactionType === filters.transactionType)
    && (filters.propertyType === "all" || property.propertyType === filters.propertyType);
}
