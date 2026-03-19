# youtube-shorts-hider

YouTube の Shorts を非表示 / ブロックして、視聴導線を自分でコントロールしやすくする Chrome 拡張です。

## できること

- Shorts 棚（`ytd-reel-shelf-renderer`）を非表示
- `/shorts/` ページをブロックして `/watch?v=...` へ移動
- 拡張の ON / OFF 切り替え
- 検索結果内の Shorts 非表示を試みる設定
- YouTube 画面上にトグルを表示
- 画面上トグルをドラッグ移動
- 画面上トグルを `×` で非表示

## Motivation

ホームや関連動画に出てくる Shorts によって、意図せず視聴時間を消費してしまうことがありました。  
そのため、YouTube の導線を自分で制御できるようにする目的で作成しました。

## 現在の仕様

### 1. Shorts ページのブロック
`/shorts/` URL を開いた場合、動画IDを取り出して `/watch?v=...` に移動します。  
動画IDが取れない場合はトップページへ戻します。

### 2. Shorts 棚の非表示
ホームや関連などに表示される Shorts 棚を削除します。

### 3. 検索結果内の Shorts 非表示
検索結果ページでは、Shorts へのリンクを含む要素を見つけて非表示化を試みます。

> ただし、YouTube 側の DOM 構造によっては完全に取り切れない場合があります。

### 4. 画面上トグル
設定で有効にすると、YouTube 画面上に小さなトグルを表示できます。

- `Shorts: OFF / ON` ボタンで拡張の有効 / 無効を切り替え
- 左側のドラッグハンドルで位置移動
- `×` ボタンで画面上トグルを非表示

ドラッグ位置は保存され、次回以降も同じ場所に表示されます。

## ファイル構成

```text
youtube-shorts-hider/
├─ manifest.json
├─ content.js
├─ options.html
├─ options.js
└─ README.md