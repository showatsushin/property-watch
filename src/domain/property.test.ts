import { describe, expect, it } from "vitest";
import { selectLatestAndPrevious, type PropertySnapshot } from "./property";

const snapshot = (checkedAt:string):PropertySnapshot => ({ propertyId:"p1",checkedAt,totalUnits:10,layouts:["3LDK"],minArea:60,maxArea:75,minPrice:5000,maxPrice:7000,pricePerTsubo:300,salePhase:"第1期",moveInDate:"2027年",availableUnits:5,sourceUrl:"https://demo.invalid/p1",mainAppeal:"駅徒歩5分",appealTags:["駅近"] });

describe("selectLatestAndPrevious",()=>{
  it("配列順ではなくcheckedAtで最新と前回を選ぶ",()=>{
    const oldest=snapshot("2026-08-01T00:00:00+09:00");
    const latest=snapshot("2026-08-21T00:00:00+09:00");
    const previous=snapshot("2026-08-18T00:00:00+09:00");
    expect(selectLatestAndPrevious([previous,oldest,latest])).toEqual({latest,previous});
  });
  it("入力配列を変更しない",()=>{
    const a=snapshot("2026-08-01T00:00:00+09:00"); const b=snapshot("2026-08-02T00:00:00+09:00"); const input=[a,b];
    selectLatestAndPrevious(input); expect(input).toEqual([a,b]);
  });
});
