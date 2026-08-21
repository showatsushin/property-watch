import { describe,expect,it } from "vitest";
import { csvTemplateColumns,normalizePropertyCsv } from "./csvImport";

const row=["csv-01","架空CSVレジデンス","架空所在地","架空駅","8","30","40","架空開発","架空販売","resale","condominium","2026-08-18T09:00:00+09:00","60","2LDK|3LDK","50","75","4800","6800","290","販売中","2027年","5","https://demo.invalid/csv-01","駅徒歩8分 × 緑景","駅近|自然",""];
const csv=(rows:string[][])=>[csvTemplateColumns,...rows].map(values=>values.join(",")).join("\n");

describe("normalizePropertyCsv",()=>{
  it("同じ物件の複数行をPropertyとsnapshot配列へ正規化する",()=>{
    const result=normalizePropertyCsv(csv([row,[...row.slice(0,11),"2026-08-21T09:00:00+09:00",...row.slice(12)]]));
    expect(result.errors).toEqual([]); expect(result.properties).toHaveLength(1);
    expect(result.properties[0].property.sourceType).toBe("csv_import");
    expect(result.properties[0].property.transactionType).toBe("resale");
    expect(result.properties[0].snapshots).toHaveLength(2);
    expect(result.properties[0].snapshots[0].pricePerTsubo).toBe(290);
    expect(result.properties[0].snapshots[0].appealTags).toEqual(["駅近","自然"]);
  });
  it("欠損値を推測せず、その行をエラーにする",()=>{
    const missing=[...row]; missing[8]="";
    const result=normalizePropertyCsv(csv([missing]));
    expect(result.properties).toEqual([]); expect(result.errors[0].message).toContain("seller");
  });
  it("未対応区分をエラーにする",()=>{
    const invalid=[...row]; invalid[9]="sale";
    expect(normalizePropertyCsv(csv([invalid])).errors[0].message).toContain("transactionType");
  });
});
