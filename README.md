# youtube-shorts-hider

YouTube の Shorts を非表示/ブロックして、視聴のコントロールをしやすくする Chrome 拡張です。

## Motivation
ホームや関連に出てくる Shorts によって意図せず時間を消費してしまうことがあり、視聴の導線を自分で制御したかったため作成しました。

## Features
- Shorts 棚（shelf）を非表示
- `/shorts/` ページをブロック（必要に応じて `/watch` にリダイレクト）
- ON/OFF 切り替え（設定画面から）
- （任意）YouTube 画面上にトグルを表示（デフォルトは非表示）

## Design / Architecture
YouTube は SPA のため DOM が動的に更新されます。そのため単発の削除処理ではなく、DOM 変化に追従する仕組みを採用しました。
一方で MutationObserver は処理を重くしやすいため、変更検知時の処理は間引き（スロットリング）し、全件走査を避ける形で負荷を抑えています。

ON/OFF は「気軽に解除しづらい」ことを優先し、基本操作は Options（拡張の設定画面）に集約しました。必要な場合のみ、設定で YouTube 上トグルを有効化できます。

## Installation (Local)
1. `chrome://extensions/` を開く
2. デベロッパーモードを ON
3. 「パッケージ化されていない拡張機能を読み込む」から本フォルダを選択

## Usage
拡張機能の「オプション」から設定を切り替えます。

## Limitations
YouTube 側の DOM 変更により、非表示対象の検出が効きにくくなる可能性があります。

## Roadmap
- 対象範囲（ホーム/検索/関連）の個別設定
- 一時解除（例：30分だけON）モード