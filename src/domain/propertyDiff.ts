import type { PropertySnapshot } from "./property";

export type DifferenceType =
  | "new"
  | "price_down"
  | "price_up"
  | "sale_phase_changed"
  | "layout_changed"
  | "available_units_changed"
  | "appeal_changed"
  | "unchanged";

export type DifferenceField =
  | "property"
  | "minPrice"
  | "maxPrice"
  | "salePhase"
  | "layouts"
  | "availableUnits"
  | "mainAppeal";

export type FieldDifference = {
  type: DifferenceType;
  field: DifferenceField;
  previousValue?: string | number | string[];
  currentValue: string | number | string[];
  delta?: number;
  label: string;
};

export type PropertyComparison = {
  propertyId: string;
  previousSnapshot?: PropertySnapshot;
  currentSnapshot: PropertySnapshot;
  differences: FieldDifference[];
  hasChanges: boolean;
  primaryStatus: DifferenceType;
};

const statusPriority: DifferenceType[] = [
  "new", "price_down", "price_up", "sale_phase_changed",
  "appeal_changed", "layout_changed", "available_units_changed", "unchanged",
];

const sameLayouts = (a: string[], b: string[]) =>
  [...a].sort().join("|") === [...b].sort().join("|");

export function compareSnapshots(
  current: PropertySnapshot,
  previous?: PropertySnapshot,
): PropertyComparison {
  if (!previous) {
    const difference: FieldDifference = {
      type: "new", field: "property", currentValue: "新規確認", label: "新規確認",
    };
    return {
      propertyId: current.propertyId,
      currentSnapshot: current,
      differences: [difference],
      hasChanges: true,
      primaryStatus: "new",
    };
  }

  const differences: FieldDifference[] = [];
  const addPrice = (field: "minPrice" | "maxPrice", label: string) => {
    const before = previous[field];
    const after = current[field];
    if (before !== after) {
      differences.push({
        type: after < before ? "price_down" : "price_up",
        field,
        previousValue: before,
        currentValue: after,
        delta: after - before,
        label,
      });
    }
  };
  addPrice("minPrice", "最低価格");
  addPrice("maxPrice", "最高価格");

  if (previous.salePhase !== current.salePhase) {
    differences.push({ type: "sale_phase_changed", field: "salePhase", previousValue: previous.salePhase, currentValue: current.salePhase, label: "販売期変更" });
  }
  if (!sameLayouts(previous.layouts, current.layouts)) {
    differences.push({ type: "layout_changed", field: "layouts", previousValue: previous.layouts, currentValue: current.layouts, label: "間取り変更" });
  }
  if (previous.availableUnits !== current.availableUnits) {
    differences.push({ type: "available_units_changed", field: "availableUnits", previousValue: previous.availableUnits, currentValue: current.availableUnits, delta: current.availableUnits - previous.availableUnits, label: "販売戸数変更" });
  }
  if (previous.mainAppeal !== current.mainAppeal) {
    differences.push({ type:"appeal_changed", field:"mainAppeal", previousValue:previous.mainAppeal, currentValue:current.mainAppeal, label:"主訴求変更" });
  }

  if (differences.length === 0) {
    differences.push({ type: "unchanged", field: "property", previousValue: "変更なし", currentValue: "変更なし", label: "変更なし" });
  }
  const primaryStatus = statusPriority.find((status) => differences.some((d) => d.type === status)) ?? "unchanged";
  return {
    propertyId: current.propertyId,
    previousSnapshot: previous,
    currentSnapshot: current,
    differences,
    hasChanges: differences.some((d) => d.type !== "unchanged"),
    primaryStatus,
  };
}
