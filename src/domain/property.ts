export type DemoPoint = { x: number; y: number };
export type TransactionType = "new_sale" | "resale" | "rental";
export type PropertyType = "condominium" | "detached_house" | "land";
export type SourceType = "mock" | "csv_import" | "public_data_mock";

export type Property = {
  id: string;
  propertyName: string;
  address: string;
  station: string;
  walkMinutes: number;
  location: DemoPoint;
  developer: string;
  seller: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  sourceType: SourceType;
};

export type PropertySnapshot = {
  propertyId: string;
  checkedAt: string;
  totalUnits: number;
  layouts: string[];
  minArea: number;
  maxArea: number;
  minPrice: number;
  maxPrice: number;
  pricePerTsubo: number;
  salePhase: string;
  moveInDate: string;
  availableUnits: number;
  sourceUrl: string;
  mainAppeal: string;
  appealTags: string[];
  campaignText?: string;
};

export type PropertyWithSnapshots = {
  property: Property;
  snapshots: PropertySnapshot[];
};

export type PropertyDataset = {
  targetProperty: PropertyWithSnapshots;
  competitors: PropertyWithSnapshots[];
};

export type SnapshotPair = {
  latest?: PropertySnapshot;
  previous?: PropertySnapshot;
};

export function selectLatestAndPrevious(snapshots: PropertySnapshot[]): SnapshotPair {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
  );
  return { latest: sorted.at(0), previous: sorted.at(1) };
}
