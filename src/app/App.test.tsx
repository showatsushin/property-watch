import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("最重要vertical slice",()=>{
  it("EMPTYからロードし、差分を質問し、変更物件の前回今回を表示する",async()=>{
    const user=userEvent.setup(); render(<App/>);
    expect(screen.getByText("競合調査データはまだありません")).toBeInTheDocument();
    expect(screen.queryByText("PROJECT CENTRAL RESIDENCE")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button",{name:/サンプルデータで試す/}));
    expect(await screen.findByText("PROJECT CENTRAL RESIDENCE")).toBeInTheDocument();
    expect(screen.getByText("12",{selector:"b"})).toBeInTheDocument();
    expect(screen.getByRole("region",{name:"デモMAP"})).toBeInTheDocument();
    await user.click(screen.getByRole("button",{name:"昨日から何が変わった？"}));
    expect(await screen.findByText(/前回調査|2026\/8\/18/)).toBeInTheDocument();
    expect(screen.getByText(/変更ありは9件/)).toBeInTheDocument();
    const list=screen.getByRole("region",{name:"競合物件一覧"});
    await user.click(within(list).getByRole("button",{name:/アオバ リバーサイド レジデンス/}));
    const detail=screen.getByRole("region",{name:"選択物件の前回今回比較"});
    expect(within(detail).getByText("5,298万円")).toBeInTheDocument();
    expect(within(detail).getAllByText("4,998万円").length).toBeGreaterThanOrEqual(2);
    expect(within(detail).getByText("-300万円")).toBeInTheDocument();
    expect(within(detail).getByText("第1期")).toBeInTheDocument();
    expect(within(detail).getByText("第2期")).toBeInTheDocument();
    expect(within(detail).getByText("主訴求変更")).toBeInTheDocument();
    expect(within(detail).getByText("水辺の開放感を楽しむレジデンス")).toBeInTheDocument();
    expect(within(detail).getAllByText("4,900万円台から × 水辺の開放感").length).toBeGreaterThan(0);
    expect(within(detail).getByText("#価格")).toBeInTheDocument();
    expect(within(detail).getByText("モデルルーム来場キャンペーン（架空）")).toBeInTheDocument();
  });
});

describe("フィルタ",()=>{
  it("3LDKのルールベース質問を一覧とMAPへ反映する",async()=>{
    const user=userEvent.setup(); render(<App/>); await user.click(screen.getByRole("button",{name:/サンプルデータで試す/}));
    await user.click(screen.getByRole("button",{name:"3LDKだけ見せて"}));
    expect(screen.getByLabelText("間取り")).toHaveValue("3LDK");
    const list=screen.getByRole("region",{name:"競合物件一覧"});
    expect(within(list).queryByText("クロスゲート南町")).not.toBeInTheDocument();
    expect(screen.getByRole("img",{name:/表示物件11件のデモ地図/})).toBeInTheDocument();
  });
  it("市場区分で一覧を絞り、MAPレイヤーを切り替える",async()=>{
    const user=userEvent.setup(); render(<App/>); await user.click(screen.getByRole("button",{name:/サンプルデータで試す/}));
    await user.selectOptions(screen.getByLabelText("取引区分"),"rental");
    const list=screen.getByRole("region",{name:"競合物件一覧"});
    expect(within(list).getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("img",{name:/表示物件2件/})).toBeInTheDocument();
    await user.click(screen.getByLabelText("中古・賃貸等"));
    expect(screen.getByRole("img",{name:/表示物件0件/})).toBeInTheDocument();
    await user.click(screen.getByLabelText("地価・取引情報Mock"));
    expect(screen.getByLabelText(/中央地区・架空標準地A/)).toBeInTheDocument();
  });
});
