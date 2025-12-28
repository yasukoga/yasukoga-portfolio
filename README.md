# yasukoga Portfolio

古賀 靖典（Koga Yasunori）のポートフォリオサイトです。

## 🌐 サイトURL

- **メインサイト**: https://yasukoga.github.io/yasukoga-portfolio/
- **ブログ**: https://yasukoga.github.io/yasukoga-portfolio/blog/

## 📝 概要

プロジェクトマネージャー（元フロントエンドエンジニア）としてのキャリアをアピールするためのポートフォリオサイトです。

### 技術スタック

- HTML + CSS + JavaScript
- ブログ機能：Node.js（Markdown → 静的HTML生成）
- ホスティング：GitHub Pages

## 🚀 開発環境のセットアップ

### 必要な環境

- Node.js（v16以上推奨）
- Git

### 初回セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yasukoga/yasukoga-portfolio.git
cd yasukoga-portfolio

# 依存パッケージをインストール
npm install
```

## ✍️ ブログ記事の追加方法

### 1. 新しいMarkdownファイルを作成

`resource/blog/articles/` ディレクトリに、Markdownファイルを作成します。

#### ファイル名について

**ファイル名は自由に設定できます**が、以下のルールがあります：

- ファイル名（拡張子 `.md` を除く）が**記事のURL（記事ID）**になります
- 日本語を含むファイル名も使用可能です
- URLで使用できない文字（`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` など）は避けてください

**推奨命名規則**: `YYYY-MM-DD-記事名.md`

```
resource/blog/articles/2025-01-15-my-first-post.md
→ URL: https://yasukoga.github.io/yasukoga-portfolio/blog/2025-01-15-my-first-post/

resource/blog/articles/2025-12-28-Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法.md
→ URL: https://yasukoga.github.io/yasukoga-portfolio/blog/2025-12-28-Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法/
```

### 2. Front Matterを記述（必須）

**重要**: Markdownファイルの先頭には、必ず以下の形式でメタデータ（Front Matter）を記述してください。

```markdown
---
title: "記事のタイトル"
date: "2025-01-15"
description: "記事の概要説明（ブログ一覧に表示されます）"
tags: ["PM", "Frontend", "AI"]
---

# 記事の本文

ここから本文を書き始めます...
```

#### Front Matterの各項目

| 項目 | 必須 | 説明 | 例 |
|------|------|------|-----|
| `title` | ✅ 必須 | 記事のタイトル | `"ブログを開設しました"` |
| `date` | ✅ 必須 | 公開日（YYYY-MM-DD形式） | `"2025-01-15"` |
| `description` | 任意 | 記事の概要（ブログ一覧に表示） | `"記事の概要説明"` |
| `tags` | 任意 | タグのリスト | `["PM", "Frontend"]` |

**注意事項**:
- `title` と `date` が記載されていない場合、その記事はビルド時にスキップされます
- Front Matterは `---` で囲む必要があります
- YAML形式で記述してください

### 3. ビルドスクリプトを実行

```bash
npm run build:blog
```

このコマンドで、Markdownファイルが静的HTMLに変換され、`blog/` ディレクトリに出力されます。

### 4. 変更をコミット＆プッシュ

```bash
git add .
git commit -m "Add new blog post: 記事タイトル"
git push origin main
```

GitHub Pagesが自動的に更新され、数分後に新しい記事が公開されます。

## 📁 ディレクトリ構造

```
yasukoga-portfolio/
├── index.html              # トップページ
├── style.css               # スタイルシート
├── script.js               # JavaScript
├── package.json            # Node.js依存関係
├── build-blog.js           # ブログビルドスクリプト
├── templates/              # HTMLテンプレート
│   ├── blog-list.html      # ブログ一覧ページテンプレート
│   └── blog-post.html      # ブログ記事ページテンプレート
├── resource/
│   ├── icon_koga.jpg       # プロフィール画像
│   ├── yasukoga_logo.svg   # ロゴ
│   └── blog/
│       └── articles/       # Markdownファイル（ソース）
│           ├── 2025-01-01-welcome-to-my-blog.md
│           └── ...
└── blog/                   # ビルド成果物（Git管理対象）
    ├── index.html          # ブログ一覧ページ
    └── [記事ID]/
        └── index.html      # 各記事ページ
```

## 🎨 デザインについて

- カラーテーマ：ライトコーラル (`#f08080`) → ライトピンク (`#ffb6c1`) のグラデーション
- フォント：M PLUS 1（Google Fonts）
- レスポンシブ対応

## 📦 使用しているnpmパッケージ

- **gray-matter**: Markdownファイルの Front Matter 解析
- **marked**: Markdown → HTML 変換
- **fs-extra**: ファイル操作の拡張機能

## 🔧 スクリプト

```bash
# ブログ記事をビルド
npm run build:blog
```

## 📄 ライセンス

MIT License

---

&copy; 2025 yasukoga. All rights reserved.
