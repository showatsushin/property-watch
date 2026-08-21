import type { Property, PropertyDataset, PropertySnapshot, PropertyWithSnapshots } from "../domain/property";

type Seed = {
  id: string; name: string; address: string; station: string; walk: number; x: number; y: number;
  units: number; layouts: string[]; area: [number, number]; prices: [number, number]; tsubo: number;
  phase: string; available: number; developer: string;
  appeal: string; tags: string[]; campaign?: string;
  changes?: Partial<Pick<PropertySnapshot, "minPrice" | "maxPrice" | "salePhase" | "layouts" | "availableUnits" | "mainAppeal" | "appealTags" | "campaignText">>;
};

const previousCheckedAt = "2026-08-18T09:30:00+09:00";
const latestCheckedAt = "2026-08-21T10:15:00+09:00";

function makeProperty(seed: Seed): PropertyWithSnapshots {
  const property: Property = {
    id: seed.id,
    propertyName: seed.name,
    address: seed.address,
    station: seed.station,
    walkMinutes: seed.walk,
    location: { x: seed.x, y: seed.y },
    developer: seed.developer,
    seller: "ミライ住販株式会社（架空）",
    transactionType: seed.id === "target-01" || !["cmp-04","cmp-06","cmp-09","cmp-11"].includes(seed.id)
      ? "new_sale"
      : ["cmp-04","cmp-09"].includes(seed.id) ? "resale" : "rental",
    propertyType: ["cmp-07","cmp-11"].includes(seed.id) ? "detached_house" : seed.id === "cmp-09" ? "land" : "condominium",
    sourceType: "mock",
  };
  const latest: PropertySnapshot = {
    propertyId: seed.id,
    checkedAt: latestCheckedAt,
    totalUnits: seed.units,
    layouts: seed.layouts,
    minArea: seed.area[0],
    maxArea: seed.area[1],
    minPrice: seed.prices[0],
    maxPrice: seed.prices[1],
    pricePerTsubo: seed.tsubo,
    salePhase: seed.phase,
    moveInDate: "2027年3月下旬（予定・架空）",
    availableUnits: seed.available,
    sourceUrl: `https://demo.invalid/properties/${seed.id}`,
    mainAppeal: seed.appeal,
    appealTags: seed.tags,
    campaignText: seed.campaign,
  };
  const previous: PropertySnapshot = { ...latest, checkedAt: previousCheckedAt, ...seed.changes };
  // 意図的に配列順を混在させ、利用側がcheckedAtで選ぶことを保証する。
  return { property, snapshots: Number(seed.id.replace(/\D/g, "")) % 2 ? [latest, previous] : [previous, latest] };
}

const target = makeProperty({
  id: "target-01", name: "PROJECT CENTRAL RESIDENCE", address: "青葉県みらい市中央一丁目（デモ用架空所在地）",
  station: "中央みらい駅（架空）", walk: 5, x: 50, y: 49, units: 168, layouts: ["2LDK", "3LDK"], area: [55.2, 82.4],
  prices: [5980, 9280], tsubo: 348, phase: "第2期", available: 14, developer: "セントラル未来開発株式会社（架空）", appeal:"都心動線と緑景を両立する全168邸", tags:["駅近","大規模","住環境"],
});

const seeds: Seed[] = [
  { id:"cmp-01", name:"アオバ リバーサイド レジデンス", address:"青葉県みらい市川辺二丁目（架空）", station:"水音駅（架空）", walk:7, x:27, y:31, units:92, layouts:["2LDK","3LDK"], area:[54.1,76.8], prices:[4998,7380], tsubo:318, phase:"第2期", available:6, developer:"青空都市開発株式会社（架空）", appeal:"4,900万円台から × 水辺の開放感", tags:["価格","眺望","自然"], campaign:"モデルルーム来場キャンペーン（架空）", changes:{minPrice:5298, salePhase:"第1期", availableUnits:8,mainAppeal:"水辺の開放感を楽しむレジデンス"} },
  { id:"cmp-02", name:"グランフォート光ヶ丘", address:"青葉県みらい市光ヶ丘三丁目（架空）", station:"光ヶ丘駅（架空）", walk:4, x:72, y:24, units:134, layouts:["2LDK","3LDK","4LDK"], area:[58.4,91.2], prices:[6280,10880], tsubo:362, phase:"第1期2次", available:11, developer:"グランフォート不動産株式会社（架空）", appeal:"駅徒歩4分 × 全邸南向き", tags:["駅近","南向き"], changes:{salePhase:"第1期1次"} },
  { id:"cmp-03", name:"ソラノワガーデン東街区", address:"青葉県みらい市東野五丁目（架空）", station:"東野ゲート駅（架空）", walk:11, x:82, y:56, units:208, layouts:["3LDK","4LDK"], area:[67.2,96.5], prices:[5790,8990], tsubo:291, phase:"第3期", available:5, developer:"ソラノワ地所株式会社（架空）", appeal:"70㎡超3LDK中心の大規模街区", tags:["広さ","3LDK","大規模"], changes:{availableUnits:9} },
  { id:"cmp-04", name:"ルミエール桜通り", address:"青葉県みらい市桜通四丁目（架空）", station:"桜通駅（架空）", walk:6, x:61, y:73, units:76, layouts:["1LDK","2LDK","3LDK"], area:[41.8,72.3], prices:[4480,7680], tsubo:336, phase:"先着順", available:4, developer:"ルミエール住宅株式会社（架空）", appeal:"桜並木を望む駅近レジデンス", tags:["駅近","眺望"], changes:{layouts:["1LDK","2LDK"], availableUnits:6} },
  { id:"cmp-05", name:"ザ・コート翠町", address:"青葉県みらい市翠町一丁目（架空）", station:"翠町駅（架空）", walk:9, x:38, y:68, units:58, layouts:["2LDK","3LDK"], area:[56.7,79.1], prices:[5480,8190], tsubo:329, phase:"最終期", available:3, developer:"翠都プロパティ株式会社（架空）", appeal:"低層レジデンス × 静かな住環境", tags:["低層","住環境"] },
  { id:"cmp-06", name:"ハーバービュー新都心", address:"青葉県みらい市新港六丁目（架空）", station:"新都心駅（架空）", walk:13, x:16, y:55, units:246, layouts:["2LDK","3LDK","4LDK"], area:[59.8,102.4], prices:[6380,11980], tsubo:354, phase:"第2期", available:18, developer:"ハーバー未来株式会社（架空）", appeal:"海辺の眺望 × 全246邸の共用空間", tags:["眺望","大規模","共用施設"], changes:{minPrice:6180, maxPrice:11680} },
  { id:"cmp-07", name:"プレイス若葉テラス", address:"青葉県みらい市若葉台二丁目（架空）", station:"若葉台駅（架空）", walk:8, x:20, y:79, units:112, layouts:["3LDK"], area:[65.4,78.6], prices:[5180,6990], tsubo:276, phase:"第1期", available:10, developer:"若葉都市企画株式会社（架空）", appeal:"全邸3LDK × 緑豊かな戸建街区", tags:["3LDK","自然","戸建"], changes:{minPrice:5380} },
  { id:"cmp-08", name:"クロスゲート南町", address:"青葉県みらい市南町七丁目（架空）", station:"南町クロス駅（架空）", walk:3, x:48, y:87, units:88, layouts:["1LDK","2LDK"], area:[38.5,64.9], prices:[4180,6780], tsubo:371, phase:"第2期3次", available:7, developer:"クロスゲート開発株式会社（架空）", appeal:"駅徒歩3分、都市生活の新拠点", tags:["駅近","利便性"], campaign:"オンライン案内会実施中（架空）", changes:{salePhase:"第2期2次",mainAppeal:"駅徒歩3分のコンパクトレジデンス"} },
  { id:"cmp-09", name:"オークヒルズ杜の街", address:"青葉県みらい市杜ヶ丘四丁目（架空）", station:"杜の街駅（架空）", walk:15, x:88, y:82, units:156, layouts:["3LDK","4LDK"], area:[70.1,98.8], prices:[5580,8480], tsubo:268, phase:"先着順", available:12, developer:"オーク都市住宅株式会社（架空）", appeal:"ゆとりの敷地で叶える緑のある暮らし", tags:["土地","自然","広さ"] },
  { id:"cmp-10", name:"レジデンス蒼空公園", address:"青葉県みらい市蒼空町三丁目（架空）", station:"公園前駅（架空）", walk:10, x:69, y:43, units:64, layouts:["2LDK","3LDK"], area:[52.3,74.5], prices:[4780,7180], tsubo:307, phase:"最終期", available:2, developer:"蒼空レジデンシャル株式会社（架空）", appeal:"公園徒歩1分 × 4,700万円台から", tags:["価格","自然","住環境"], changes:{availableUnits:5} },
  { id:"cmp-11", name:"ブリーズコート西の杜", address:"青葉県みらい市西の杜一丁目（架空）", station:"西の杜駅（架空）", walk:12, x:9, y:24, units:104, layouts:["2LDK","3LDK","4LDK"], area:[57.9,93.6], prices:[4890,7980], tsubo:284, phase:"第2期", available:9, developer:"ブリーズホーム株式会社（架空）", appeal:"家族の成長に寄り添う庭付き住戸", tags:["戸建","子育て","専用庭"], changes:{layouts:["2LDK","3LDK"]} },
  { id:"cmp-12", name:"セントリーフ月見台", address:"青葉県みらい市月見台五丁目（架空）", station:"月見台駅（架空）", walk:5, x:91, y:35, units:120, layouts:["2LDK","3LDK"], area:[60.2,84.7], prices:[6080,8880], tsubo:342, phase:"第1期", available:13, developer:"セントリーフ開発株式会社（架空）", appeal:"大規模商業施設徒歩圏 × 駅徒歩5分", tags:["駅近","商業施設","利便性"] },
];

export const mockDataset: PropertyDataset = {
  targetProperty: target,
  competitors: seeds.map(makeProperty),
};
