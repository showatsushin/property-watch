import { describe,expect,it } from "vitest";
import { mockDataset } from "../data/mockProperties";
import { selectLatestAndPrevious } from "../domain/property";
import { compareSnapshots } from "../domain/propertyDiff";
import { MockResearchAssistantProvider } from "./MockResearchAssistantProvider";

const provider=new MockResearchAssistantProvider();
const comparisons=mockDataset.competitors.map(item=>{const {latest,previous}=selectLatestAndPrevious(item.snapshots);return compareSnapshots(latest!,previous)});
const ask=(message:string)=>provider.answer({message,targetProperty:mockDataset.targetProperty,competitors:mockDataset.competitors,comparisons});

describe("訴求に関する限定質問",()=>{
  it("駅近タグで決定論的に回答する",async()=>expect((await ask("駅近を訴求している物件は？")).matchedPropertyIds).toEqual(["cmp-02","cmp-04","cmp-08","cmp-12"]));
  it("価格タグで決定論的に回答する",async()=>expect((await ask("価格を訴求している物件は？")).matchedPropertyIds).toEqual(["cmp-01","cmp-10"]));
  it("主訴求の文字列が変わった物件を回答する",async()=>expect((await ask("主訴求が変わった物件は？")).matchedPropertyIds).toEqual(["cmp-01","cmp-08"]));
});
