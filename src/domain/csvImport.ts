import type { Property, PropertySnapshot, PropertyType, PropertyWithSnapshots, TransactionType } from "./property";

export type CsvImportError = { row: number; message: string };
export type CsvImportResult = { properties: PropertyWithSnapshots[]; errors: CsvImportError[] };

const columns = [
  "id","propertyName","address","station","walkMinutes","locationX","locationY","developer","seller",
  "transactionType","propertyType","checkedAt","totalUnits","layouts","minArea","maxArea","minPrice",
  "maxPrice","pricePerTsubo","salePhase","moveInDate","availableUnits","sourceUrl","mainAppeal","appealTags",
] as const;
const templateColumns=[...columns,"campaignText"] as const;

function parseRows(csv:string):string[][] {
  const rows:string[][]=[]; let row:string[]=[]; let value=""; let quoted=false;
  for(let i=0;i<csv.length;i+=1){const char=csv[i];
    if(char==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i+=1;}else quoted=!quoted;}
    else if(char===","&&!quoted){row.push(value);value="";}
    else if((char==="\n"||char==="\r")&&!quoted){if(char==="\r"&&csv[i+1]==="\n")i+=1;row.push(value);value="";if(row.some(cell=>cell!==""))rows.push(row);row=[];}
    else value+=char;
  }
  row.push(value); if(row.some(cell=>cell!==""))rows.push(row); return rows;
}

const transactionTypes:TransactionType[]=["new_sale","resale","rental"];
const propertyTypes:PropertyType[]=["condominium","detached_house","land"];
const numberFields=["walkMinutes","locationX","locationY","totalUnits","minArea","maxArea","minPrice","maxPrice","pricePerTsubo","availableUnits"] as const;

export function normalizePropertyCsv(csv:string):CsvImportResult {
  const rows=parseRows(csv.replace(/^\uFEFF/,""));
  if(rows.length===0)return {properties:[],errors:[{row:1,message:"CSVが空です"}]};
  const header=rows[0].map(x=>x.trim());
  const missingColumns=columns.filter(column=>!header.includes(column));
  if(missingColumns.length)return {properties:[],errors:[{row:1,message:`必須列がありません: ${missingColumns.join(", ")}`}]};
  const byId=new Map<string,PropertyWithSnapshots>(); const errors:CsvImportError[]=[];
  rows.slice(1).forEach((cells,index)=>{
    const rowNumber=index+2; const record=Object.fromEntries(header.map((key,i)=>[key,cells[i]?.trim()??""])) as Record<string,string>;
    const empty=columns.filter(column=>record[column]==="");
    if(empty.length){errors.push({row:rowNumber,message:`値がありません: ${empty.join(", ")}`});return;}
    const invalidNumber=numberFields.find(field=>!Number.isFinite(Number(record[field])));
    if(invalidNumber){errors.push({row:rowNumber,message:`数値ではありません: ${invalidNumber}`});return;}
    if(!transactionTypes.includes(record.transactionType as TransactionType)){errors.push({row:rowNumber,message:"transactionTypeが未対応です"});return;}
    if(!propertyTypes.includes(record.propertyType as PropertyType)){errors.push({row:rowNumber,message:"propertyTypeが未対応です"});return;}
    if(Number.isNaN(Date.parse(record.checkedAt))){errors.push({row:rowNumber,message:"checkedAtが有効な日時ではありません"});return;}
    const layouts=record.layouts.split("|").map(x=>x.trim()).filter(Boolean);
    if(layouts.length===0){errors.push({row:rowNumber,message:"layoutsが空です"});return;}
    const property:Property={id:record.id,propertyName:record.propertyName,address:record.address,station:record.station,walkMinutes:Number(record.walkMinutes),location:{x:Number(record.locationX),y:Number(record.locationY)},developer:record.developer,seller:record.seller,transactionType:record.transactionType as TransactionType,propertyType:record.propertyType as PropertyType,sourceType:"csv_import"};
    const appealTags=record.appealTags.split("|").map(x=>x.trim()).filter(Boolean);
    if(appealTags.length===0){errors.push({row:rowNumber,message:"appealTagsが空です"});return;}
    const snapshot:PropertySnapshot={propertyId:record.id,checkedAt:record.checkedAt,totalUnits:Number(record.totalUnits),layouts,minArea:Number(record.minArea),maxArea:Number(record.maxArea),minPrice:Number(record.minPrice),maxPrice:Number(record.maxPrice),pricePerTsubo:Number(record.pricePerTsubo),salePhase:record.salePhase,moveInDate:record.moveInDate,availableUnits:Number(record.availableUnits),sourceUrl:record.sourceUrl,mainAppeal:record.mainAppeal,appealTags,campaignText:record.campaignText||undefined};
    const existing=byId.get(record.id);
    if(existing){
      const stableKeys:(keyof Property)[]=["propertyName","address","station","walkMinutes","location","developer","seller","transactionType","propertyType"];
      if(stableKeys.some(key=>JSON.stringify(existing.property[key])!==JSON.stringify(property[key]))){errors.push({row:rowNumber,message:`同じidの物件基本情報が一致しません: ${record.id}`});return;}
      existing.snapshots.push(snapshot);
    }else byId.set(record.id,{property,snapshots:[snapshot]});
  });
  return {properties:[...byId.values()],errors};
}

export const csvTemplateColumns=[...templateColumns];
