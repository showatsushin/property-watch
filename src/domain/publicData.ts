import type { DemoPoint, SourceType } from "./property";

export type PublicDataKind = "land_price" | "nearby_transaction";

export type PublicDataMock = {
  id: string;
  kind: PublicDataKind;
  label: string;
  location: DemoPoint;
  valueLabel: string;
  observedAt: string;
  sourceType: Extract<SourceType, "public_data_mock">;
};

export const publicDataMocks: PublicDataMock[] = [
  { id:"land-01", kind:"land_price", label:"中央地区・架空標準地A", location:{x:43,y:40}, valueLabel:"42.8万円/㎡", observedAt:"2026年（デモ）", sourceType:"public_data_mock" },
  { id:"land-02", kind:"land_price", label:"東野地区・架空標準地B", location:{x:78,y:67}, valueLabel:"35.2万円/㎡", observedAt:"2026年（デモ）", sourceType:"public_data_mock" },
  { id:"trade-01", kind:"nearby_transaction", label:"中央地区・架空取引事例", location:{x:57,y:59}, valueLabel:"中古マンション 5,180万円", observedAt:"2026年第2四半期（デモ）", sourceType:"public_data_mock" },
  { id:"trade-02", kind:"nearby_transaction", label:"西の杜地区・架空取引事例", location:{x:24,y:71}, valueLabel:"土地 3,260万円", observedAt:"2026年第2四半期（デモ）", sourceType:"public_data_mock" },
];
