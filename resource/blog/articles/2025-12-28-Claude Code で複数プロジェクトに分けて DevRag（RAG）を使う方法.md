---
title: "Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法"
date: "2025-12-28"
description: ""
tags: ["AI", "PM"]
---

# Claude Code で複数プロジェクトに分けて DevRag（RAG）を使う方法

Claude Code に RAG を導入できる DevRag ですが、複数のプロジェクトを扱う場合は注意が必要です。デフォルト設定のままだと、違うプロジェクトのドキュメントが検索結果に混ざってしまう可能性があります。

この記事では、プロジェクトごとに DevRag を分離して設定する方法をまとめます。

## 前提知識

### DevRag とは

DevRag は Claude Code 用の無料 RAG ツールです。ドキュメントをベクトル検索できるようになり、Claude Code が自動で関連情報を見つけてくれます。

詳しくは：[Claude Code に無料の RAG 導入でトークン＆時間節約](https://zenn.dev/abalol/articles/claude-code-rag)

### MCP のスコープ

Claude Code の MCP 設定には 3 つのスコープがあります。

| スコープ  | 設定ファイル                             | 影響範囲                             |
| --------- | ---------------------------------------- | ------------------------------------ |
| `local`   | `~/.claude.json`（プロジェクトパス配下） | そのプロジェクトのみ（個人用）       |
| `project` | `.mcp.json`（プロジェクトルート）        | そのプロジェクトのみ（チーム共有可） |
| `user`    | `~/.claude.json`                         | 全プロジェクト共通                   |

> **注**: 優先順位は `local` > `project` > `user` の順です。

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

この設定だと、DevRag はデフォルトの `./documents`（カレントディレクトリ配下の documents フォルダ）を検索します。どのプロジェクトで Claude Code を起動しても同じ設定が使われるため、プロジェクト固有の設定ができません。

```
project-a/ で起動 → ./documents を検索
project-b/ で起動 → ./documents を検索

→ 各プロジェクトに documents/ があれば分離されるが、
   config.json の細かい設定（chunk_size 等）を変えられない
```

## 解決策：プロジェクトごとに .mcp.json と config.json を作る

各プロジェクトのルートに `.mcp.json` と `config.json` を作成し、そのプロジェクト専用の設定を書きます。

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

各プロジェクトのディレクトリに移動して、`--scope project` オプションで設定します。

```bash
# project-a の設定
cd ~/projects/project-a
claude mcp add devrag --scope project -- /usr/local/bin/devrag

# project-b の設定
cd ~/projects/project-b
claude mcp add devrag --scope project -- /usr/local/bin/devrag
```

> **注**: `-s` は `--scope` の短縮形として使える場合があります。

#### 方法 2: 設定ファイルを直接作成

各プロジェクトのルートに `.mcp.json` を作成します。

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

そして、同じディレクトリに `config.json` を作成して DevRag の設定を行います。

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

project-b も同様に設定します。

### 動作確認

```bash
cd ~/projects/project-a
claude

> /mcp
MCP Servers:
✓ devrag (connected)    ← project-a の documents/ を検索
```

別のプロジェクトでも確認：

```bash
cd ~/projects/project-b
claude

> /mcp
MCP Servers:
✓ devrag (connected)    ← project-b の documents/ を検索
```

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

DevRag は `documents_dir` 配下を再帰的にインデックス化するため、シンボリックリンク先のファイルも検索対象になります。

> **注**: DevRag は stdio 方式の MCP サーバーとして動作するため、ポート番号を指定して複数インスタンスを起動する方法は使用できません。プロジェクトごとに分離したい場合は、上記のようにプロジェクトごとの `config.json` で `documents_dir` を設定してください。

## Git での管理

`.mcp.json` をリポジトリに含めるかどうかは、チームの方針次第です。

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

チームメンバーも同じ設定で使えます。ただし、全員が DevRag をインストールしている必要があります。

### 含めない場合（個人設定）

```gitignore
# .gitignore
.mcp.json
config.json
vectors.db
```

個人の好みで MCP を設定できます。

## トラブルシューティング

### 「違うプロジェクトの情報が出てくる」

グローバル設定（`~/.claude.json`）に DevRag が登録されている可能性があります。

```bash
# グローバル設定を確認
claude mcp list

# 不要なグローバル設定を削除
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

これは Claude Code の既知の動作です。project スコープのサーバーは `claude mcp list` には表示されませんが、正常に動作します。

```bash
# 個別に確認する場合
claude mcp get devrag
```

## まとめ

| やりたいこと           | 設定方法                                            |
| ---------------------- | --------------------------------------------------- |
| プロジェクトごとに分離 | `.mcp.json` と `config.json` を各プロジェクトに作成 |
| 検索対象フォルダを指定 | `config.json` の `documents_dir` で設定             |
| グローバル設定を避ける | `--scope project` でプロジェクト単位に設定          |
| 共通ドキュメントも使う | シンボリックリンクを使用                            |

ポイントは **グローバル設定（`~/.claude.json`）ではなく、プロジェクトごとの設定（`.mcp.json` + `config.json`）を使う** ことです。

これで、複数のプロジェクトを扱っても情報が混ざらず、安心して DevRag を活用できます。

---

## 変更履歴・訂正箇所

この記事は元記事から以下の点を修正しています：

1. **MCP スコープの数**: 2 つ → 3 つ（`local`, `project`, `user`）に訂正
2. **デフォルトディレクトリ**: `~/documents/` → `./documents`（相対パス）に訂正
3. **`--port` オプション**: DevRag は stdio 方式の MCP サーバーであり、ポート指定オプションは存在しないため削除
4. **複数インスタンスの方法**: ポート指定による複数起動 → `config.json` による設定分離に変更
5. **設定方法**: コマンドライン引数 `--docs-dir` → `config.json` での設定に変更（DevRag は設定ファイルベース）
