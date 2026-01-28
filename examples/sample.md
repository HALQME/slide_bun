---
title: 機能網羅デモ
author: Slide Bun User
theme: dark
aspectRatio: 16/9
---

# Slide Bun Features {.center}

全ての機能を詰め込んだデモ・スライドです。

Created by Slide Bun {.caption .right}

::: speaker
ここからデモ開始。
まずはタイトルのインパクトを強調。
:::

---

## 基本的なタイポグラフィ

Markdownの標準記法がそのまま使えます。

- **強調（Bold）** や _斜体（Italic）_
- `インラインコード`
- リンク: [GitHub](https://github.com)

1. 番号付きリスト
2. もサポート

::: speaker
基本機能の紹介。
:::

---

## 2カラムレイアウト {.center}

`::: columns` で左右に分割できます。

::: columns
:::: col

### 左側

- リスト
- テキスト
- 画像など

::::
:::: col

### 右側

コードブロックも置けます。

```typescript
const hello = "world";
console.log(hello);
```

::::
:::

この行はカラムレイアウトの影響を受けません。{.bottom}

---

## 画像の最適化 (Fit) {.center}

`{.fit}` クラスでスライド内に収めます。

![Placeholder](https://placehold.co/600x400){.fit}

図1: プレースホルダー画像{.caption}

---

### テキストユーティリティの例（ハイライト・枠）

テキストの意図（注目・枠付け）を示すためのユーティリティも使えます。  
インラインで強調したい語句には `[...]` とクラスを併用します（例: `[重要]{.mark}`）。

この段落では [重要]{.mark} な語句をハイライトして表示します。

---

### 画像ユーティリティの例（数値指定）

意図的に画像の見た目を調整するために、数値付きユーティリティを使えます。

書式は `{.opacity 60}` のようにクラス名と数値を空白で並べます。
数値はパーセンテージとして解釈されます。

:::columns
::::col
![Muted](https://placehold.co/600x400/00ff55/ffffff){.fit .opacity 60 .gray 80}
図2: 不透明度60%かつグレースケール80%の例{.caption}
::::
::::col
![Muted](https://placehold.co/600x400/00ff55/ffffff){.fit }
図3: フィルター無しの画像{.caption}
::::
:::

---

## 背景画像 (Cover)

`{.cover}` クラスで全画面表示になります。
文字は上に重なります。

![Background](https://placehold.co/1920x1080/0055ff/ffffff){.cover}

<br>
<br>
<br>

**背景の上に文字を書く**ことも可能です。
{.center}

---

## スピーカーノート

このスライドにはスピーカーノートがあります。  
(画面には表示されません)

::: speaker

- プレゼンターにしか見えないメモ
- カンペとして利用可能
- `::: speaker` ブロックで記述

:::


---

## テーブル要素

| ヘッダー1 | ヘッダー2 | ヘッダー3 |
| --------- | --------- | --------- |
| データ1   | データ2   | データ3   |
| データ4   | データ5   | データ6   |
