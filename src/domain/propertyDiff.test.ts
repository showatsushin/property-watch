import { describe, expect, it } from "vitest";
import type { PropertySnapshot } from "./property";
import { compareSnapshots } from "./propertyDiff";

const base:PropertySnapshot={propertyId:"p1",checkedAt:"2026-08-18T00:00:00+09:00",totalUnits:100,layouts:["2LDK","3LDK"],minArea:50,maxArea:80,minPrice:5298,maxPrice:8000,pricePerTsubo:333,salePhase:"第1期",moveInDate:"2027年",availableUnits:8,sourceUrl:"https://demo.invalid/p1",mainAppeal:"駅徒歩5分",appealTags:["駅近"]};

describe("compareSnapshots",()=>{
  it("複数差分をdifferencesにすべて保持する",()=>{
    const current={...base,checkedAt:"2026-08-21T00:00:00+09:00",minPrice:4998,salePhase:"第2期",availableUnits:5};
    const result=compareSnapshots(current,base);
    expect(result.differences.map(d=>d.type)).toEqual(["price_down","sale_phase_changed","available_units_changed"]);
    expect(result.differences[0].delta).toBe(-300);
    expect(result.primaryStatus).toBe("price_down");
  });
  it("間取り順だけの違いは変更扱いにしない",()=>{
    const result=compareSnapshots({...base,layouts:["3LDK","2LDK"]},base);
    expect(result.primaryStatus).toBe("unchanged");
  });
  it("前回snapshotがない場合はnew",()=>expect(compareSnapshots(base).primaryStatus).toBe("new"));
  it("坪単価を価格や面積から再計算しない",()=>{
    const result=compareSnapshots({...base,minPrice:4998,pricePerTsubo:333},base);
    expect(result.currentSnapshot.pricePerTsubo).toBe(333);
    expect(result.differences.map(d=>d.field)).not.toContain("pricePerTsubo");
  });
  it("主訴求の文字列変更をappeal_changedとして保持する",()=>{
    const result=compareSnapshots({...base,mainAppeal:"3LDK 4,900万円台から"},base);
    expect(result.differences).toContainEqual(expect.objectContaining({type:"appeal_changed",label:"主訴求変更"}));
  });
});
