import { selectLatestAndPrevious } from "../domain/property";
import type { ResearchAssistantProvider, ResearchAssistantRequest, ResearchAssistantResponse } from "./ResearchAssistantProvider";

const listNames = (ids: string[], request: ResearchAssistantRequest) =>
  ids.map((id) => request.competitors.find((item) => item.property.id === id)?.property.propertyName).filter(Boolean).join("、");

export class MockResearchAssistantProvider implements ResearchAssistantProvider {
  async answer(request: ResearchAssistantRequest): Promise<ResearchAssistantResponse> {
    const query = request.message.replace(/\s/g, "");
    if (query.includes("主訴求") && (query.includes("変わった") || query.includes("変更"))) {
      const ids=request.comparisons.filter(item=>item.differences.some(d=>d.type==="appeal_changed")).map(item=>item.propertyId);
      return {intent:"appeal_changed",matchedPropertyIds:ids,message:`前回調査から主訴求が変わった物件は${ids.length}件です：${listNames(ids,request)}。文字列の変更のみを比較しています。`};
    }
    if (query.includes("駅近") && query.includes("訴求")) {
      const ids=request.competitors.filter(item=>selectLatestAndPrevious(item.snapshots).latest?.appealTags.includes("駅近")).map(item=>item.property.id);
      return {intent:"station_appeal",matchedPropertyIds:ids,message:`「駅近」タグを持つ物件は${ids.length}件です：${listNames(ids,request)}。`};
    }
    if (query.includes("価格") && query.includes("訴求")) {
      const ids=request.competitors.filter(item=>selectLatestAndPrevious(item.snapshots).latest?.appealTags.includes("価格")).map(item=>item.property.id);
      return {intent:"price_appeal",matchedPropertyIds:ids,message:`「価格」タグを持つ物件は${ids.length}件です：${listNames(ids,request)}。`};
    }
    if (query.includes("昨日") || query.includes("何が変わった") || query.includes("変更")) {
      const changed = request.comparisons.filter((item) => item.hasChanges);
      const ids = changed.map((item) => item.propertyId);
      const dates = changed.flatMap((item) => [item.previousSnapshot?.checkedAt, item.currentSnapshot.checkedAt]).filter(Boolean).map(String).sort();
      const range = dates.length ? `${new Date(dates[0]).toLocaleString("ja-JP")}から${new Date(dates.at(-1)!).toLocaleString("ja-JP")}まで` : "前回調査から今回調査まで";
      return { intent:"summarize_changes", matchedPropertyIds:ids, message:`${range}の差分です。変更ありは${ids.length}件：${listNames(ids, request)}。` };
    }
    if (query.includes("価格") && (query.includes("下げ") || query.includes("値下"))) {
      const ids = request.comparisons.filter((item) => item.differences.some((d) => d.type === "price_down")).map((item) => item.propertyId);
      return { intent:"price_down", matchedPropertyIds:ids, message:ids.length ? `最低・最高価格を下げた物件は${ids.length}件です：${listNames(ids, request)}。` : "価格を下げた物件はありません。" };
    }
    const layout = query.match(/[1-4]LDK/i)?.[0].toUpperCase();
    if (layout) {
      const ids = request.competitors.filter((item) => selectLatestAndPrevious(item.snapshots).latest?.layouts.includes(layout)).map((item) => item.property.id);
      return { intent:"layout_filter", matchedPropertyIds:ids, filterAction:{layout}, message:`${layout}を含む${ids.length}件に絞り込みました。` };
    }
    if (query.includes("10分以内") && query.includes("5000万円台")) {
      const ids = request.competitors.filter((item) => { const s=selectLatestAndPrevious(item.snapshots).latest; return item.property.walkMinutes <= 10 && !!s && s.minPrice >= 5000 && s.minPrice < 6000; }).map((item) => item.property.id);
      return { intent:"price_walk_filter", matchedPropertyIds:ids, filterAction:{priceBand:"5000s",maxWalkMinutes:10}, message:`駅徒歩10分以内・最低価格5000万円台は${ids.length}件です：${listNames(ids, request)}。` };
    }
    if (query.includes("うちより") && query.includes("坪単価") && query.includes("安")) {
      const targetPrice = selectLatestAndPrevious(request.targetProperty.snapshots).latest?.pricePerTsubo ?? 0;
      const ids = request.competitors.filter((item) => (selectLatestAndPrevious(item.snapshots).latest?.pricePerTsubo ?? Infinity) < targetPrice).map((item) => item.property.id);
      return { intent:"cheaper_than_target", matchedPropertyIds:ids, message:`自社物件の比較用坪単価${targetPrice}万円/坪より安い物件は${ids.length}件です：${listNames(ids, request)}。` };
    }
    return { intent:"unsupported", matchedPropertyIds:[], message:"このデモでは、前回調査からの変更・値下げ物件・間取り・駅徒歩と価格帯・自社物件との坪単価比較に回答できます。" };
  }
}
