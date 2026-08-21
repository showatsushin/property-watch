import { useMemo, useState } from "react";
import { defaultFilters, matchesFilters, type PropertyFilters } from "../domain/filters";
import { selectLatestAndPrevious, type PropertyDataset, type PropertyWithSnapshots } from "../domain/property";
import { compareSnapshots, type DifferenceType, type PropertyComparison } from "../domain/propertyDiff";
import { normalizePropertyCsv, type CsvImportError } from "../domain/csvImport";
import { publicDataMocks } from "../domain/publicData";
import { MockPropertySourceProvider } from "../providers/MockPropertySourceProvider";
import { MockResearchAssistantProvider } from "../providers/MockResearchAssistantProvider";
import "./App.css";

const propertySource = new MockPropertySourceProvider();
const assistant = new MockResearchAssistantProvider();
const yen = (value: number) => `${value.toLocaleString("ja-JP")}万円`;
const statusLabels: Record<DifferenceType, string> = {
  new:"新規", price_down:"価格↓", price_up:"価格↑", sale_phase_changed:"販売期", layout_changed:"間取り", available_units_changed:"販売戸数", appeal_changed:"主訴求", unchanged:"変更なし",
};
type Tab = "properties" | "map" | "assistant";
type MapLayers = { competitors:boolean; otherMarkets:boolean; publicData:boolean };
const transactionLabels={new_sale:"新築",resale:"中古",rental:"賃貸"} as const;
const propertyTypeLabels={condominium:"マンション",detached_house:"戸建",land:"土地"} as const;

function comparisonFor(item: PropertyWithSnapshots) {
  const { latest, previous } = selectLatestAndPrevious(item.snapshots);
  if (!latest) return undefined;
  return compareSnapshots(latest, previous);
}

function Filters({ filters, onChange, salePhases }: { filters:PropertyFilters; onChange:(value:PropertyFilters)=>void; salePhases:string[] }) {
  const set = <K extends keyof PropertyFilters>(key:K, value:PropertyFilters[K]) => onChange({...filters,[key]:value});
  return <section className="filters" aria-label="競合物件フィルタ">
    <div className="filter-grid">
      <label>価格帯<select value={filters.priceBand} onChange={(e)=>set("priceBand",e.target.value as PropertyFilters["priceBand"])}><option value="all">すべて</option><option value="under5000">5,000万円未満</option><option value="5000s">5,000万円台</option><option value="6000plus">6,000万円以上</option></select></label>
      <label>間取り<select value={filters.layout} onChange={(e)=>set("layout",e.target.value)}><option value="all">すべて</option>{["1LDK","2LDK","3LDK","4LDK"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>専有面積<select value={filters.minArea} onChange={(e)=>set("minArea",Number(e.target.value))}><option value="0">指定なし</option><option value="60">60㎡以上を含む</option><option value="70">70㎡以上を含む</option><option value="80">80㎡以上を含む</option></select></label>
      <label>駅徒歩<select value={filters.maxWalkMinutes} onChange={(e)=>set("maxWalkMinutes",Number(e.target.value))}><option value="20">指定なし</option><option value="5">5分以内</option><option value="10">10分以内</option><option value="15">15分以内</option></select></label>
      <label>販売期<select value={filters.salePhase} onChange={(e)=>set("salePhase",e.target.value)}><option value="all">すべて</option>{salePhases.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>取引区分<select value={filters.transactionType} onChange={(e)=>set("transactionType",e.target.value as PropertyFilters["transactionType"])}><option value="all">すべて</option><option value="new_sale">新築</option><option value="resale">中古</option><option value="rental">賃貸</option></select></label>
      <label>物件種別<select value={filters.propertyType} onChange={(e)=>set("propertyType",e.target.value as PropertyFilters["propertyType"])}><option value="all">すべて</option><option value="condominium">マンション</option><option value="detached_house">戸建</option><option value="land">土地</option></select></label>
      <label className="check"><input type="checkbox" checked={filters.changedOnly} onChange={(e)=>set("changedOnly",e.target.checked)}/>変更ありのみ</label>
    </div>
    <button className="text-button" onClick={()=>onChange(defaultFilters)}>条件をリセット</button>
  </section>;
}

function PropertyList({ items, comparisons, selectedId, onSelect }:{items:PropertyWithSnapshots[]; comparisons:Map<string,PropertyComparison>; selectedId?:string; onSelect:(id:string)=>void}) {
  return <section className="property-list" aria-label="競合物件一覧">
    <div className="section-heading"><div><span className="eyebrow">COMPETITORS</span><h2>競合物件</h2></div><strong>{items.length}件</strong></div>
    {items.length===0 ? <div className="no-results">条件に一致する物件はありません。</div> : items.map((item)=>{
      const snap=selectLatestAndPrevious(item.snapshots).latest!; const comparison=comparisons.get(item.property.id)!;
      return <button key={item.property.id} className={`property-card ${selectedId===item.property.id?"selected":""}`} onClick={()=>onSelect(item.property.id)} aria-pressed={selectedId===item.property.id}>
        <div className="card-top"><span><span className={`status ${comparison.primaryStatus}`}>{statusLabels[comparison.primaryStatus]}</span><span className="market-tag">{transactionLabels[item.property.transactionType]} · {propertyTypeLabels[item.property.propertyType]}</span></span><span className="walk">{item.property.station} 徒歩{item.property.walkMinutes}分</span></div>
        <h3>{item.property.propertyName}</h3>
        <div className="card-metrics"><div><small>最低価格</small><b>{yen(snap.minPrice)}</b></div><div><small>坪単価</small><b>{snap.pricePerTsubo}万円</b></div><div><small>総戸数</small><b>{snap.totalUnits}戸</b></div></div>
        <div className="card-foot"><span>{snap.layouts.join(" · ")}</span><span>{snap.salePhase}</span></div>
      </button>;
    })}
  </section>;
}

function MockMap({ target, items, comparisons, selectedId, onSelect, layers, onLayersChange }:{target:PropertyWithSnapshots; items:PropertyWithSnapshots[]; comparisons:Map<string,PropertyComparison>; selectedId?:string; onSelect:(id:string)=>void; layers:MapLayers; onLayersChange:(v:MapLayers)=>void}) {
  const visibleItems=items.filter(item=>item.property.transactionType==="new_sale"?layers.competitors:layers.otherMarkets);
  const selected=visibleItems.find(x=>x.property.id===selectedId); const selectedSnap=selected&&selectLatestAndPrevious(selected.snapshots).latest;
  const setLayer=(key:keyof MapLayers,value:boolean)=>onLayersChange({...layers,[key]:value});
  return <section className="map-panel" aria-label="デモMAP">
    <div className="map-title"><div><span className="eyebrow">LOCATION OVERVIEW</span><h2>競合デモMAP</h2></div><span className="demo-chip">実在位置と無関係のデモ座標</span></div>
    <div className="layer-switch" aria-label="MAPレイヤー切替"><label><input type="checkbox" checked={layers.competitors} onChange={e=>setLayer("competitors",e.target.checked)}/>競合物件</label><label><input type="checkbox" checked={layers.otherMarkets} onChange={e=>setLayer("otherMarkets",e.target.checked)}/>中古・賃貸等</label><label><input type="checkbox" checked={layers.publicData} onChange={e=>setLayer("publicData",e.target.checked)}/>地価・取引情報Mock</label></div>
    <div className="mock-map">
      <svg viewBox="0 0 100 100" role="img" aria-label={`調査対象物件と表示物件${visibleItems.length}件のデモ地図`}>
        <rect width="100" height="100" fill="#eef0ea"/><path d="M0 18 L100 5 M0 62 L100 77 M18 0 L31 100 M74 0 L61 100" stroke="#fff" strokeWidth="5"/><path d="M0 20 L100 7 M0 64 L100 79 M20 0 L33 100 M76 0 L63 100" stroke="#cbd2ca" strokeWidth=".6" strokeDasharray="2 2"/><path d="M0 43 Q32 32 100 48" fill="none" stroke="#b8dce2" strokeWidth="8"/><g fill="#dfe5d8"><rect x="38" y="32" width="18" height="12" rx="2"/><rect x="74" y="63" width="15" height="13" rx="2"/></g>
        <g className="station-mark"><circle cx="45" cy="57" r="2"/><text x="48" y="58">中央みらい駅</text></g>
        <g className="target-pin" transform={`translate(${target.property.location.x} ${target.property.location.y})`}><circle r="4.7"/><path d="M0 8 L-3 3 H3Z"/><text x="0" y="1.2">自</text></g>
        {visibleItems.map(item=>{const c=comparisons.get(item.property.id)!; const active=item.property.id===selectedId; return <g key={item.property.id} className={`map-pin ${item.property.transactionType!=="new_sale"?"other-market":""} ${c.primaryStatus} ${active?"active":""}`} transform={`translate(${item.property.location.x} ${item.property.location.y})`} onClick={()=>onSelect(item.property.id)} role="button" tabIndex={0} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" ")onSelect(item.property.id)}} aria-label={`${item.property.propertyName} ${statusLabels[c.primaryStatus]}`}><circle r={active?4.5:3.5}/><text y="1.2">{item.property.id.slice(-2)}</text></g>})}
        {layers.publicData&&publicDataMocks.map(point=><g key={point.id} className={`public-pin ${point.kind}`} transform={`translate(${point.location.x} ${point.location.y})`} aria-label={`${point.label} ${point.valueLabel}`}><title>{point.label}：{point.valueLabel}（固定架空データ）</title><rect x="-3.5" y="-3.5" width="7" height="7" rx="1"/><text y="1.2">{point.kind==="land_price"?"地":"取"}</text></g>)}
      </svg>
      <div className="map-legend"><span><i className="target-dot"/>調査対象</span><span><i className="change-dot"/>変更あり</span><span><i className="other-dot"/>中古・賃貸等</span>{layers.publicData&&<span><i className="public-dot"/>公的データ将来像Mock</span>}</div>
      {selected&&selectedSnap&&<div className="map-popover"><span className={`status ${comparisons.get(selected.property.id)?.primaryStatus}`}>{statusLabels[comparisons.get(selected.property.id)!.primaryStatus]}</span><h3>{selected.property.propertyName}</h3><div><b>{yen(selectedSnap.minPrice)}〜</b><span>{selectedSnap.pricePerTsubo}万円/坪</span></div><p>{selectedSnap.totalUnits}戸 · {selected.property.station} 徒歩{selected.property.walkMinutes}分</p><strong className="map-appeal">{selectedSnap.mainAppeal}</strong></div>}
    </div>
  </section>;
}

function PropertyDetail({ item, comparison, onClose }:{item:PropertyWithSnapshots; comparison:PropertyComparison; onClose:()=>void}) {
  const p=comparison.previousSnapshot; const c=comparison.currentSnapshot;
  const value=(field:string,s:typeof c)=>field.includes("Price")?yen(s[field as "minPrice"|"maxPrice"] as number):field==="availableUnits"?`${s.availableUnits}戸`:field==="layouts"?s.layouts.join("・"):field==="mainAppeal"?s.mainAppeal:s.salePhase;
  return <section className="detail-panel" aria-label="選択物件の前回今回比較">
    <button className="close" onClick={onClose} aria-label="詳細を閉じる">×</button><span className="eyebrow">CHANGE DETAIL</span><h2>{item.property.propertyName}</h2><p className="muted">{item.property.address}</p>
    <div className="date-range"><div><small>前回調査</small><b>{p?new Date(p.checkedAt).toLocaleString("ja-JP"):"—"}</b></div><span>→</span><div><small>今回調査</small><b>{new Date(c.checkedAt).toLocaleString("ja-JP")}</b></div></div>
    <div className="detail-metrics"><span>最低価格<b>{yen(c.minPrice)}</b></span><span>坪単価<b>{c.pricePerTsubo}万円/坪</b></span><span>総戸数<b>{c.totalUnits}戸</b></span><span>駅徒歩<b>{item.property.walkMinutes}分</b></span></div>
    <div className="diff-list">{comparison.differences.map((d,i)=><div className={`diff-row ${d.type}`} key={`${d.field}-${i}`}><strong>{d.label}</strong><div className="before-after"><span>{p&&d.field!=="property"?value(d.field,p):"—"}</span><i>→</i><span>{d.field!=="property"?value(d.field,c):String(d.currentValue)}</span></div>{d.delta!==undefined&&<em>{d.delta>0?"+":""}{d.field.includes("Price")?`${d.delta.toLocaleString()}万円`:`${d.delta}戸`}</em>}</div>)}</div>
    <div className="appeal-box"><small>MAIN APPEAL / 主訴求</small><strong>{c.mainAppeal}</strong><div>{c.appealTags.map(tag=><span key={tag}>#{tag}</span>)}</div>{c.campaignText&&<p><b>CAMPAIGN</b>{c.campaignText}</p>}</div>
    <div className="facts"><span>市場区分 <b>{transactionLabels[item.property.transactionType]} / {propertyTypeLabels[item.property.propertyType]}</b></span><span>データ出所 <b>{item.property.sourceType}</b></span><span>間取り <b>{c.layouts.join(" / ")}</b></span><span>専有面積 <b>{c.minArea}–{c.maxArea}㎡</b></span><span>入居 <b>{c.moveInDate}</b></span><span>売主 <b>{item.property.seller}</b></span></div>
  </section>;
}

function Assistant({ dataset, comparisons, onFilter, onSelect }:{dataset:PropertyDataset; comparisons:PropertyComparison[]; onFilter:(v:Partial<PropertyFilters>)=>void; onSelect:(id:string)=>void}) {
  const [query,setQuery]=useState(""); const [answer,setAnswer]=useState("質問例を選ぶか、下の入力欄から質問してください。"); const [matches,setMatches]=useState<string[]>([]);
  const ask=async(message:string)=>{const response=await assistant.answer({message,targetProperty:dataset.targetProperty,competitors:dataset.competitors,comparisons}); setQuery(message); setAnswer(response.message); setMatches(response.matchedPropertyIds); if(response.filterAction)onFilter(response.filterAction);};
  const examples=["昨日から何が変わった？","価格を下げた物件は？","駅近を訴求している物件は？","価格を訴求している物件は？","主訴求が変わった物件は？","3LDKだけ見せて","駅徒歩10分以内で5000万円台は？","うちより坪単価が安い物件は？"];
  return <section className="assistant-panel" aria-label="競合調査アシスタント">
    <div className="assistant-head"><div className="bot-mark">R</div><div><span className="eyebrow">RULE-BASED DEMO</span><h2>競合調査アシスタント</h2></div></div>
    <div className="demo-notice"><b>デモ用ルールベース調査アシスタント</b><span>実AI・Web検索は使用していません</span></div>
    <div className="assistant-answer" aria-live="polite"><span>ASSISTANT</span><p>{answer}</p>{matches.length>0&&<div className="answer-links">{matches.slice(0,5).map(id=>{const item=dataset.competitors.find(x=>x.property.id===id)!;return <button key={id} onClick={()=>onSelect(id)}>{item.property.propertyName} →</button>})}</div>}</div>
    <div className="question-examples"><small>質問例</small>{examples.map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
    <form className="ask-form" onSubmit={(e)=>{e.preventDefault();if(query.trim())ask(query)}}><label htmlFor="assistant-query">質問を入力</label><div><input id="assistant-query" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="前回からの変更を質問"/><button type="submit">送信</button></div></form>
  </section>;
}

function CsvImportBar({ onImport, errors, message }:{onImport:(file:File)=>void;errors:CsvImportError[];message:string}) {
  return <section className="import-bar" aria-label="CSV手動インポート">
    <div><span className="eyebrow">MANUAL CSV IMPORT</span><b>手動CSV取込</b><small>正当に出力・取得したCSVをローカルで処理します。REINS等への接続はありません。</small></div>
    <div className="import-actions"><a href={`${import.meta.env.BASE_URL}demo-property-import.csv`} download>デモ用テンプレートCSV</a><label className="import-button">CSVを選択<input type="file" accept=".csv,text/csv" onChange={e=>{const file=e.target.files?.[0];if(file)onImport(file);e.target.value=""}}/></label></div>
    {message&&<p className={errors.length?"import-message error":"import-message"} role="status">{message}</p>}
    {errors.length>0&&<details><summary>取込エラー {errors.length}件</summary>{errors.map((error,i)=><p key={`${error.row}-${i}`}>行{error.row}: {error.message}</p>)}</details>}
  </section>;
}

export default function App() {
  const [dataset,setDataset]=useState<PropertyDataset>(); const [filters,setFilters]=useState(defaultFilters); const [selectedId,setSelectedId]=useState<string>(); const [tab,setTab]=useState<Tab>("properties");
  const [layers,setLayers]=useState<MapLayers>({competitors:true,otherMarkets:true,publicData:false}); const [importErrors,setImportErrors]=useState<CsvImportError[]>([]); const [importMessage,setImportMessage]=useState("");
  const comparisons=useMemo(()=>dataset?.competitors.map(comparisonFor).filter(Boolean) as PropertyComparison[]|undefined,[dataset]);
  const comparisonMap=useMemo(()=>new Map(comparisons?.map(c=>[c.propertyId,c])??[]),[comparisons]);
  const filtered=useMemo(()=>dataset?.competitors.filter(item=>{const snap=selectLatestAndPrevious(item.snapshots).latest;const comp=comparisonMap.get(item.property.id);return !!snap&&!!comp&&matchesFilters(item.property,snap,comp,filters)})??[],[dataset,comparisonMap,filters]);
  const selected=dataset?.competitors.find(x=>x.property.id===selectedId); const selectedComparison=selectedId?comparisonMap.get(selectedId):undefined;
  const load=async()=>{const data=await propertySource.loadSampleDataset();setDataset(data);setSelectedId(undefined);};
  const importCsv=async(file:File)=>{
    const result=normalizePropertyCsv(await file.text()); setImportErrors(result.errors);
    if(result.properties.length){setDataset(current=>{if(!current)return current;const ids=new Set(result.properties.map(x=>x.property.id));return {...current,competitors:[...current.competitors.filter(x=>!ids.has(x.property.id)),...result.properties]}});}
    setImportMessage(result.properties.length?`${result.properties.length}物件を取り込みました${result.errors.length?`（${result.errors.length}行は取り込めませんでした）`:""}`:`取り込める物件がありませんでした（${result.errors.length}件のエラー）`);
  };
  if(!dataset)return <main className="empty-page"><header className="brand"><div className="brand-mark">PW</div><div><b>PROPERTY WATCH</b><span>新築分譲マンション競合調査</span></div></header><section className="empty-card"><span className="empty-icon">⌖</span><span className="eyebrow">COMPETITIVE RESEARCH DEMO</span><h1>競合調査データは<br/>まだありません</h1><p>架空の競合物件データを読み込み、価格・販売期・販売戸数の変化をMAPと一覧で確認できます。</p><button className="primary" onClick={load}>サンプルデータで試す <span>→</span></button><small>外部検索や実在物件データは使用しません</small></section></main>;
  const targetSnap=selectLatestAndPrevious(dataset.targetProperty.snapshots).latest!; const changeCount=comparisons?.filter(x=>x.hasChanges).length??0; const phases=[...new Set(dataset.competitors.map(x=>selectLatestAndPrevious(x.snapshots).latest!.salePhase))];
  const select=(id:string)=>{setSelectedId(id);setTab("properties")};
  return <main className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark">PW</div><div><b>PROPERTY WATCH</b><span>新築分譲マンション競合調査</span></div></div><div className="state"><i/> CHANGES FOUND</div></header>
    <section className="project-summary"><div className="project-name"><span className="eyebrow">TARGET PROPERTY / 調査対象</span><h1>{dataset.targetProperty.property.propertyName}</h1><p>{dataset.targetProperty.property.station} 徒歩{dataset.targetProperty.property.walkMinutes}分 · {targetSnap.layouts.join(" / ")}</p></div><div className="summary-metrics"><div><small>比較用坪単価</small><b>{targetSnap.pricePerTsubo}<em>万円/坪</em></b></div><div><small>競合物件</small><b>{dataset.competitors.length}<em>件</em></b></div><div className="accent"><small>変更あり</small><b>{changeCount}<em>件</em></b></div><div><small>今回調査</small><b className="date">{new Date(targetSnap.checkedAt).toLocaleDateString("ja-JP")}</b></div></div></section>
    <Filters filters={filters} onChange={setFilters} salePhases={phases}/>
    <CsvImportBar onImport={importCsv} errors={importErrors} message={importMessage}/>
    <nav className="mobile-tabs" aria-label="表示切替">{(["properties","map","assistant"] as Tab[]).map((x)=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(tab===x&&x==="assistant"?"properties":x)}>{x==="properties"?"物件":x==="map"?"MAP":"AI"}</button>)}</nav>
    <div className="workspace"><div className={`pane list-pane ${tab==="properties"?"mobile-active":""}`}><PropertyList items={filtered} comparisons={comparisonMap} selectedId={selectedId} onSelect={select}/>{selected&&selectedComparison&&<PropertyDetail item={selected} comparison={selectedComparison} onClose={()=>setSelectedId(undefined)}/>}</div><div className={`pane map-pane ${tab==="map"?"mobile-active":""}`}><MockMap target={dataset.targetProperty} items={filtered} comparisons={comparisonMap} selectedId={selectedId} onSelect={select} layers={layers} onLayersChange={setLayers}/></div><div className={`pane ai-pane ${tab==="assistant"?"mobile-active":""}`}><Assistant dataset={dataset} comparisons={comparisons??[]} onFilter={(patch)=>setFilters(v=>({...v,...patch}))} onSelect={select}/></div></div>
    <footer>すべて架空データです · デモMAP · 外部API接続なし</footer>
  </main>;
}
