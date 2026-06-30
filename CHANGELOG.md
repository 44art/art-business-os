# CHANGELOG

## Phase3 — 入力・出力・導線の実用性改善（2026-06-30）

### Phase3-A：入力画面の使いやすさ改善

#### ブランド管理 (`app/brand/page.tsx`)
- 保存後に成功バナーを表示し「AIマーケティング分析へ」「ペルソナを作成する」の2リンクを設置
- ページ上部のインフォボックスに `/analysis` へのリンクを追加

#### 作品管理 (`components/ArtworkForm.tsx`)
- 保存後に `savedOk` ステートで成功パネルを表示（即時リダイレクトを廃止）
- 「AIマーケティング分析へ」「コンテンツを生成する」「作品一覧に戻る」の3導線を提示

#### ワークショップ管理 (`components/WorkshopForm.tsx`)
- 同様の `savedOk` 保存後パネルを実装
- 「WS告知文を生成する」「このWSのペルソナを作成する」「WS一覧に戻る」の3導線を提示

#### ペルソナ作成 (`components/PersonaForm.tsx`)
- 保存後に `savedOk` ステートで成功パネルを表示（即時リダイレクトを廃止）
- 「コンテンツを生成する」「別のペルソナを作成する」「ペルソナ一覧へ」の3導線を提示

#### ペルソナ一覧 (`app/personas/page.tsx`)
- 「次のステップ」ボックスの "(実装予定)" テキストを実際のリンクボタンに修正
  - 「コンテンツを生成する →」(`/content`)
  - 「AIマーケティング分析へ →」(`/analysis`)

### Phase3-B：出力結果の実用性改善

#### AIマーケティング分析 (`lib/analysis.ts`, `app/analysis/page.tsx`)
- `buildBrandNextActions` / `buildArtworkNextActions` / `buildWorkshopNextActions` に優先度ラベルを導入
  - `[今すぐ]`（赤ドット）/ `[次に整える]`（黄ドット）/ `[後で検討]`（白ドット）
- 分析結果画面に「今すぐ → 次に整える → 後で検討 の順に優先度が下がります」サブタイトルを追加
- 「ペルソナ作成機能は今後実装予定です」という古い文言を削除

#### コンテンツ生成 (`lib/content.ts`)
- `genSnsPost`: 最初の2行に痛みや共感フックを配置、チャネル情報CTAを追加
- `genWsAnnounce`: 日時・場所プレースホルダー、緊急性テキスト、「初心者歓迎」を追加
- `genArtworkSales`: 「大切な方へのギフト・プレゼント」用途、「同じ作品は二度と制作しません」希少性を追加
- `genLineMessage`: 「必ずお返事します」で信頼感を追加
- `genLpIntro`: ファーストビュー/サブコピー/問題提起/解決策/CTAの構成に整理

#### LP作成支援 (`lib/lp.ts`)
- `genAwareness` のテンプレートリテラルバグを修正（シングルクォート → バッククォート）
- `.filter((l) => l !== undefined)` を `.filter(Boolean)` に統一
- 作品販売LP: ギフト用途、アフターフォローあり文言を追加
- WS予約LP: 「少人数制・初心者歓迎・道具すべてご用意」を追加

#### LINE活用支援 (`lib/line.ts`)
- `buildDeliveryNotes` を全面改訂：「関係づくり → 販売」の流れと宣伝:価値提供 = 3:7 比率ガイダンスを追加

#### SNS戦略 (`lib/sns.ts`)
- `sourceStrengths()` 関数の undefined 対応不備を修正
  - `Brand.strengths` / `Artwork.features` / `Workshop.description` に `|| ''` フォールバックを追加

#### AIコンサルタント (`lib/consultant.ts`)
- 全4フェーズの `nextActions` 配列に `[今すぐ]` / `[次に整える]` / `[後で検討]` ラベルを追加
- `diagnoseOverall` の `topPriority` を構造化：▼問題点 / ▼今すぐやること / ▼次に整えること / ▼後で検討すること の4セクション形式に変更

### Phase3 全体動作確認と修正

#### 各画面の「次のステップ」導線修正
- `app/content/page.tsx` — 「LP作成支援へ →」(`/lp`) のリンクボタンを設置（"実装予定"を削除）
- `app/lp/page.tsx` — 「LINE活用支援へ →」(`/line`) のリンクボタンを設置（"実装予定"を削除）
- `app/line/page.tsx` — 「SNS戦略へ →」(`/sns-strategy`) のリンクボタンを設置（"実装予定"を削除）

#### ダッシュボード (`app/page.tsx`)
- `buildPhases()` で4フェーズ（認知/集客/販売/リピーター化）を動的データから構築
- フェーズ別進捗カード: 未着手/進行中/準備OK の3状態表示
- 登録データサマリー（ブランド/作品/WS/ペルソナ件数）を表示
- 作成済みコンテンツサマリー（コンテンツ/LP案/LINE戦略/SNS戦略件数）を表示
- 最近の保存データ一覧（最新4件）を表示
- AIコンサルタント診断済みの場合、最優先アクションをダッシュボード上部に表示

### 品質確認
- TypeScript エラーなし（ソースコード）
- Next.js ビルド成功（全17ルート）
- `(実装予定)` 表示をすべて実際のリンクボタンに置換

---

## Phase2 — AIマーケティング支援機能 初期実装（2026-06-30）

### 追加した機能

#### 素材登録
- **ブランド管理** (`/brand`) — コンセプト・強み・販売導線・価格帯を登録・編集
- **作品管理** (`/artworks`) — 作品一覧・新規登録・編集・削除。ステータス管理（販売中/売却済み/非公開）
- **ワークショップ管理** (`/workshops`) — WS一覧・新規登録・編集・削除。開催形式・ステータス管理

#### マーケティング分析
- **AIマーケティング分析** (`/analysis`) — 登録済みブランド/作品/WSを選択し、認知・集客・販売・リピーターの4軸でルールベース分析。8カテゴリの強み/弱み/改善提案を表示。ペルソナ作成への導線を設置

#### ペルソナ
- **ペルソナ作成** (`/personas`, `/personas/new`, `/personas/[id]/edit`) — ブランド/作品/WSに紐づくペルソナを作成・編集・削除。AIマーケティング分析からドラフト自動生成。10項目（年齢/性別/職業/悩み/欲求/購入理由/購入不安/刺さる言葉/使用チャネル/販売導線）

#### コンテンツ生成
- **コンテンツ生成** (`/content`) — ペルソナ選択 → 5種別（SNS投稿/WS告知/作品販売文/LINE配信文/LP導入文）選択 → たたき台生成・編集・保存。フェーズ（認知/集客/販売/リピーター）別フィルター

#### LP作成支援
- **LP作成支援** (`/lp`) — ペルソナ + コンテンツ参照 + 5目的（作品販売/WS予約/問い合わせ/LINE登録/認知拡大）選択 → 9セクション構成案生成・編集・保存。LINE URL設定で次機能へ引き継ぎ

#### LINE活用支援
- **LINE活用支援** (`/line`) — ペルソナ + コンテンツ・LP案参照 → 5目的選択 → 8セクション（登録導線〜ステップ配信案）生成・編集・保存。LP URL自動引き継ぎ。SNS戦略引き継ぎデータ出力

#### SNS戦略
- **SNS戦略** (`/sns-strategy`) — ペルソナ + コンテンツ/LP/LINE参照 → 6目的（認知拡大/WS集客/作品販売/LINE登録/ファン化/リピーター化）× 6媒体（X/Instagram/Facebook/YouTube/TikTok/Threads）複数選択 → 8セクション戦略案生成・編集・保存。AIコンサルタント引き継ぎデータ（フェーズ/週間投稿数/主要CTA）出力

#### AIコンサルタント
- **AIコンサルタント** (`/consultant`) — 診断対象（ブランド/作品/WS）選択 → 関連ペルソナ/コンテンツ/LP/LINE/SNS戦略を自動読み込み → 認知・集客・販売・リピーター化の4フェーズ別診断（できていること/足りていないこと/改善提案/次のアクション） → 全体診断（最優先改善ポイント/次の一手/今使える導線/弱い導線/コンテンツ案） → 編集・保存。AI免責表示必須

#### ダッシュボード
- **ダッシュボード** (`/`) — 認知・集客・販売・リピーターのフェーズ別作成済み件数をリアルタイム表示。初回スタートガイド / 継続時の次アクション案内。AI提案・人間判断の説明文を設置

### 技術仕様

#### フレームワーク・スタイル
- Next.js 16.2.9 (App Router、Turbopack)
- Tailwind CSS v4 (`@import "tailwindcss"`)
- TypeScript 5

#### データ永続化
- localStorage（9キー）
  - `abo_brand` — ブランド情報
  - `abo_artworks` — 作品一覧
  - `abo_workshops` — ワークショップ一覧
  - `abo_personas` — ペルソナ一覧
  - `abo_content_drafts` — コンテンツ案一覧
  - `abo_lp_drafts` — LP案一覧
  - `abo_line_drafts` — LINE戦略案一覧
  - `abo_sns_strategy_drafts` — SNS戦略案一覧
  - `abo_consultant_reports` — AIコンサルタント診断レポート一覧
- `lib/storage.ts` に一元集約（直接アクセスなし）

#### データ連携フロー
```
ブランド/作品/WS登録
  → AIマーケティング分析（ルールベース8カテゴリ）
  → ペルソナ作成（sourceType + sourceId で紐づけ）
  → コンテンツ生成（personaId で紐づけ）
  → LP作成（コンテンツ参照 + LINE URL生成）
  → LINE活用（LP URL自動引き継ぎ + SNS引き継ぎデータ出力）
  → SNS戦略（LINE CTA/チャネル引き継ぎ + AIコンサルタント引き継ぎ）
  → AIコンサルタント（全データ統合診断）
```

#### 設計原則
- AI提案 + 人間最終判断 の2層構造（全生成画面に免責表示）
- フェーズベース設計（認知/集客/販売/リピーター化）
- ルールベース仮実装（外部AI API連携はPhase3以降）
- Server Components でのパラメータ解決（Next.js 16: `await params`）

### ファイル構成

```
app/
  page.tsx               — ダッシュボード（動的件数表示）
  brand/page.tsx         — ブランド管理
  artworks/              — 作品管理（一覧/新規/編集）
  workshops/             — WS管理（一覧/新規/編集）
  analysis/page.tsx      — AIマーケティング分析
  personas/              — ペルソナ（一覧/新規/編集）
  content/page.tsx       — コンテンツ生成
  lp/page.tsx            — LP作成支援
  line/page.tsx          — LINE活用支援
  sns-strategy/page.tsx  — SNS戦略
  consultant/page.tsx    — AIコンサルタント
components/
  Sidebar.tsx            — グローバルナビゲーション
  PersonaForm.tsx        — ペルソナ作成/編集フォーム
  ArtworkForm.tsx        — 作品作成/編集フォーム
  WorkshopForm.tsx       — WS作成/編集フォーム
  PageShell.tsx          — 共通ページシェル（未実装画面用）
  FormField.tsx          — フォームフィールドコンポーネント
lib/
  storage.ts             — localStorage CRUD（全9キー）
  analysis.ts            — マーケティング分析エンジン
  content.ts             — コンテンツ生成エンジン
  lp.ts                  — LP生成エンジン
  line.ts                — LINE戦略生成エンジン
  sns.ts                 — SNS戦略生成エンジン
  consultant.ts          — マーケティング導線診断エンジン
types/
  index.ts               — 全データ型定義（Brand/Artwork/Workshop/Persona/ContentDraft/LandingPageDraft/LineStrategyDraft/SnsStrategyDraft/ConsultantReport 他）
```

---

## Phase1 — 初期プロジェクトセットアップ（2026-06-30）

- Next.js 16.2.9 プロジェクト作成（Create Next App）
- Tailwind CSS v4 設定
- 基本ディレクトリ構成
- サイドバーナビゲーション実装
- 各機能ページのスタブ（PageShell）配置
