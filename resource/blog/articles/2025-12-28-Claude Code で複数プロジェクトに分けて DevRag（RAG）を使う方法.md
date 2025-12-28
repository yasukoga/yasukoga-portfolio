---
title: "Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法"
date: "2025-12-28"
description: "DevRag を使って複数プロジェクトで独立したRAGを構築する方法。MCP スコープの仕組みと project スコープの管理方法を整理"
tags: ["Claude Code", "DevRag", "RAG", "MCP", "AI"]
---

# Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法

Claude Code に RAG を導入できる DevRag。複数のプロジェクトを扱う場合はスコープの設定に注意が必要。デフォルト設定のままだと、違うプロジェクトのドキュメントが検索結果に混ざってしまう可能性がある。

この記事では、プロジェクトごとに DevRag を分離して設定する方法と、MCP スコープの挙動について整理する。

## 前提知識

### DevRag とは

DevRag は Claude Code 用の無料 RAG ツール。ドキュメントをベクトル検索できるようになり、Claude Code が自動で関連情報を見つけてくれる。

詳しくは：[Claude Code に無料の RAG 導入でトークン＆時間節約](https://zenn.dev/abalol/articles/claude-code-rag)

### MCP スコープ

Claude Code の MCP 設定には主に 2 つのスコープがある。

| スコープ  | 設定ファイル                      | 影響範囲                             | `claude mcp list` |
| --------- | --------------------------------- | ------------------------------------ | ----------------- |
| `project` | `.mcp.json`（プロジェクトルート） | そのプロジェクトのみ（チーム共有可） | ❌ 表示されない   |
| `user`    | `~/.claude.json`                  | 全プロジェクト共通                   | ✅ 表示される     |

> **注**: 優先順位は `project` > `user` の順。同名サーバーがある場合は project が優先される。
>
> **補足**: 実際には `local` スコープも存在するが、内部管理で直接編集できないため、実用上は `project` と `user` を使い分ければ OK。

### 公式ドキュメント

MCP 設定の詳細は [Anthropic 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code/mcp) を参照。

`.mcp.json`（ドット始まり）は公式の仕様。隠しファイルとしてプロジェクトルートに配置する。

## 問題：グローバル設定だと情報が混ざる

よくある設定例（これだと問題あり）：

```json
// ~/.claude.json（グローバル設定）
{
  "mcpServers": {
    "devrag": {
      "command": "devrag"
    }
  }
}
```

この設定だと、DevRag はデフォルトの `./documents`（カレントディレクトリ配下の documents フォルダ）を検索する。どのプロジェクトで Claude Code を起動しても同じ設定が使われるため、プロジェクト固有の設定ができない。

```
project-a/ で起動 → ./documents を検索
project-b/ で起動 → ./documents を検索

→ 各プロジェクトに documents/ があれば分離されるが、
   config.json の細かい設定（chunk_size 等）を変えられない
```

## 解決策：プロジェクトごとに .mcp.json と config.json を作る

各プロジェクトのルートに `.mcp.json` と `config.json` を作成し、そのプロジェクト専用の設定を書く。

### ディレクトリ構成

```
~/projects/
├── project-a/
│   ├── .mcp.json           ← project-a 用の MCP 設定
│   ├── config.json         ← project-a 用の DevRag 設定
│   ├── documents/          ← project-a のドキュメント
│   │   ├── api-spec.md
│   │   └── architecture.md
│   └── src/
│
└── project-b/
    ├── .mcp.json           ← project-b 用の MCP 設定
    ├── config.json         ← project-b 用の DevRag 設定
    ├── documents/          ← project-b のドキュメント
    │   ├── requirements.md
    │   └── design.md
    └── src/
```

### 設定方法

#### 方法 1: コマンドで設定

各プロジェクトのディレクトリに移動して、`--scope project` オプションで設定する。

```bash
# project-a の設定
cd ~/projects/project-a
claude mcp add devrag --scope project -- /usr/local/bin/devrag

# project-b の設定
cd ~/projects/project-b
claude mcp add devrag --scope project -- /usr/local/bin/devrag
```

> **注**: `-s` は `--scope` の短縮形として使える。

#### 方法 2: 設定ファイルを直接作成

各プロジェクトのルートに `.mcp.json` を作成する。

```json
// ~/projects/project-a/.mcp.json
{
  "mcpServers": {
    "devrag": {
      "type": "stdio",
      "command": "/usr/local/bin/devrag"
    }
  }
}
```

そして、同じディレクトリに `config.json` を作成して DevRag の設定を行う。

```json
// ~/projects/project-a/config.json
{
  "documents_dir": "./documents",
  "db_path": "./vectors.db",
  "chunk_size": 500,
  "search_top_k": 5,
  "compute": {
    "device": "auto",
    "fallback_to_cpu": true
  },
  "model": {
    "name": "multilingual-e5-small",
    "dimensions": 384
  }
}
```

project-b も同様に設定。

## project スコープの管理方法

### claude mcp list に表示されない問題

`claude mcp list` を実行しても project スコープの MCP は表示されない。これは [GitHub Issue #5963](https://github.com/anthropics/claude-code/issues/5963) で報告されている既知の問題。

### 代替の確認方法

```bash
# 個別サーバーの詳細を取得（これは動作する）
claude mcp get devrag

# Claude Code 起動後に /mcp コマンドで確認
claude
> /mcp

# 直接ファイルを見る
cat .mcp.json
```

### 削除・編集

```bash
# コマンドで削除（スコープ指定が必要）
claude mcp remove devrag --scope project

# または .mcp.json を直接編集・削除
```

## Claude 起動時の挙動

Claude Code 起動時、以下の順序で MCP サーバーがロードされる：

1. **user スコープ**（`~/.claude.json`）→ 全プロジェクト共通
2. **project スコープ**（`.mcp.json`）→ そのプロジェクト固有

両方設定していれば、両方起動する。

### .mcp.json がない場所での挙動

`.mcp.json` がないディレクトリで Claude を起動した場合、**user スコープの MCP サーバーのみ起動**する。

```
~/random-folder/   ← .mcp.json なし
└── (ファイルなし)

$ cd ~/random-folder
$ claude

→ user スコープ（~/.claude.json）の MCP のみ起動
→ project スコープの MCP は何も起動しない
```

DevRag を project スコープのみで設定している場合、`.mcp.json` がないディレクトリでは DevRag は使えない。

## 応用：共通ドキュメントとプロジェクト固有を併用

会社共通のドキュメント（コーディング規約など）と、プロジェクト固有のドキュメントを両方使いたい場合。

### 方法: シンボリックリンク

共通ドキュメントをシンボリックリンクで各プロジェクトに配置：

```bash
ln -s ~/shared-docs ~/projects/project-a/documents/shared
ln -s ~/shared-docs ~/projects/project-b/documents/shared
```

```
project-a/
└── documents/
    ├── api-spec.md          ← プロジェクト固有
    └── shared/ → ~/shared-docs  ← 共通（シンボリックリンク）
```

DevRag は `documents_dir` 配下を再帰的にインデックス化するため、シンボリックリンク先のファイルも検索対象になる。

> **注**: DevRag は stdio 方式の MCP サーバーとして動作するため、ポート番号を指定して複数インスタンスを起動する方法は使用できない。プロジェクトごとに分離したい場合は、上記のようにプロジェクトごとの `config.json` で `documents_dir` を設定する。

## Git での管理

`.mcp.json` をリポジトリに含めるかどうかは、チームの方針次第。

### 含める場合（チームで共有）

```json
// .mcp.json（コミットする）
{
  "mcpServers": {
    "devrag": {
      "type": "stdio",
      "command": "devrag"
    }
  }
}
```

チームメンバーも同じ設定で使える。ただし、全員が DevRag をインストールしている必要がある。

### 含めない場合（個人設定）

```gitignore
# .gitignore
.mcp.json
config.json
vectors.db
```

個人の好みで MCP を設定できる。

## トラブルシューティング

### 「違うプロジェクトの情報が出てくる」

user スコープ（`~/.claude.json`）に DevRag が登録されている可能性がある。

```bash
# user スコープの設定を確認
claude mcp list

# 不要な user スコープの設定を削除
claude mcp remove devrag --scope user
```

### 「MCP が接続されない」

1. DevRag がインストールされているか確認

```bash
which devrag
# /usr/local/bin/devrag
```

2. `.mcp.json` の場所を確認（プロジェクトルートに置く）

3. Claude Code を再起動

### 「documents/ が見つからない」

`config.json` の `documents_dir` に指定したパスが存在するか確認：

```bash
ls ./documents/
```

### 「project スコープのサーバーが claude mcp list に表示されない」

これは既知の問題（GitHub Issue #5963）。以下の方法で確認可能。

```bash
# 個別に確認する場合
claude mcp get devrag

# Claude 起動後に確認
claude
> /mcp
```

## まとめ

| やりたいこと           | 設定方法                                            |
| ---------------------- | --------------------------------------------------- |
| プロジェクトごとに分離 | `.mcp.json` と `config.json` を各プロジェクトに作成 |
| 検索対象フォルダを指定 | `config.json` の `documents_dir` で設定             |
| グローバル設定を避ける | `--scope project` でプロジェクト単位に設定          |
| 共通ドキュメントも使う | シンボリックリンクを使用                            |
| 設定を確認             | `claude mcp get <name>` または `/mcp`               |

ポイントは **グローバル設定（`~/.claude.json`）ではなく、プロジェクトごとの設定（`.mcp.json` + `config.json`）を使う** こと。

これで、複数のプロジェクトを扱っても情報が混ざらず、安心して DevRag を活用できる。
