# Property Watch — 新築分譲マンション競合調査MAP

架空データだけで、競合物件の現在値と前回調査からの変化を一覧・デモMAP・ルールベースアシスタントで確認する第1弾モックです。

## 公開デモURL

GitHubリポジトリ所有者の確定後、次のURLで公開予定です。

```text
https://<GitHubユーザー名>.github.io/property-watch/
```

GitHub PagesのSourceは「GitHub Actions」を選択します。`main`へのpush時にtestとbuildが成功した場合だけ、`dist/`をデプロイします。

## 起動

```sh
npm install
npm run dev
```

初回画面ではデータを読み込みません。「サンプルデータで試す」を押すと、架空の調査対象物件1件と競合12件をロードします。

## 検証

```sh
npm test
npm run build
```

## デモの境界

- 物件名、所在地、駅、価格、事業者、座標はすべて架空です。
- MAPはSVGによるデモ表示で、実在位置との対応を意味しません。
- アシスタントは限定質問に答える決定論的なルールベース実装です。
- Web検索、スクレイピング、Google Maps、外部API、実AI、バックエンド、認証、永続化、定期実行はありません。
- `sourceUrl` はデータ構造の確認用に予約済みの `.invalid` ドメインを持ちますが、アクセスはしません。

## 交換境界

- `PropertySourceProvider`: サンプルデータ取得元
- `MockMap` のprops境界: 地図表示
- `ResearchAssistantProvider`: 調査質問への回答

snapshotの選択と差分判定は通常のTypeScript純関数です。`checkedAt`で最新・前回を選択し、複数の変更を`differences`に保持します。

## 市場区分とCSV

- 取引区分：新築・中古・賃貸
- 物件種別：マンション・戸建・土地
- 画面から手動でCSVを選び、`Property` / `PropertySnapshot`へローカル正規化
- 必須列や値が欠けた行は推測せず、行番号付きエラーとして表示
- [デモ用テンプレート](public/demo-property-import.csv)を同梱
- `sourceType`は`mock` / `csv_import` / `public_data_mock`

地価公示・周辺取引価格は将来像を示す固定架空MAPレイヤーだけです。REINSや国土交通省APIへの接続・自動取得はありません。

## 主訴求

各snapshotは`mainAppeal`、`appealTags`、任意の`campaignText`を持ちます。第1弾ではすべて固定架空値で、主訴求の変化は文字列の完全比較、質問への回答はタグの一致だけで判定します。

将来像は「Web検索／公式サイト取得 → AIで主訴求を構造化 → snapshot保存 → 訴求変化を比較」です。これは構想の記載のみで、第1弾には取得処理・AI処理とも実装していません。
