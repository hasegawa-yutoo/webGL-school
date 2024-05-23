# 開発環境

node v18.17.0

## Code format：VS Code 拡張機能(Extensions)

[Visual Studio Code](https://azure.microsoft.com/ja-jp/products/visual-studio-code/)を推奨環境としています。

タスクと連携のため下記 Extensions を追加してください。

- EditorConfig for VS Code
- Prettier - Code formatter
- Stylelint
- ESLint

## プロジェクトのセットアップ

初回のみ

```
npm install
```

## プロジェクトの起動

```
npm start
```

## gulp タスク

- pug → HTML
- Sass（scss）→ CSS
  - Stylelint
- Javascript
  - ESLint
  - Webpack bundle
- Local Server
  - Hot Reload
  - Server Side Include（SSI）
- Image Optimize
  - webP
  - AVIF

## ディレクトリ構成

`/src/` で開発用ファイルを管理します。

`/public/` に各種変換/コンパイル/ビルドしたファイルが格納されます。直接 public を触ることはありません。

### /src/\_data

HTML の head タグに反映する meta 関連の情報を json で管理します。

### /src/img

gulp の image タスクで、画像を圧縮します。watch 状態であればこのディレクトリにファイルを追加するだけで圧縮します。
そして、圧縮された画像をwebP、AVIF形式に変換します。

`/src/img/` 配下に作成した任意のフォルダ構造のまま公開ディレクトリ(public)に出力します。

```
例）
/src/img/assets/img/sample.png
↓
/public/assets/img/sample.webp
/public/assets/img/sample.avif
```

### /src/js

gulp の js タスクで Webpack を使って、分割している js ファイルは bundle します。

`/src/js/_module/` 配下には import 用の js ファイルを格納します。

`/src/js/` 配下に作成した任意のフォルダ構造のまま公開ディレクトリ(public)に出力します。

```
例）
/src/js/assets/js/script.js
↓
/public/assets/js/script.js
```

### /src/pug

gulp の pug タスクで Pug ファイルを HTML に変換します。

`/src/pug/_include/` に extends する layout ファイルやインクルード用ファイルをまとめています。

各 pug ファイルでは `- var directory ='/'` の項目で `/src/_data/site.json` のオブジェクトのキーと紐付けることで json で指定した値を head タグに反映します。

`/src/pug/` 配下に作成した任意のフォルダ構造のまま公開ディレクトリ(public)に出力します。

```
例）
/src/pug/sample/index.pug
↓
/public/sample/index.html
```

### /src/scss

gulp の sass タスクで scss ファイルを css に変換します。

`/src/scss/` 配下に作成した任意のフォルダ構造のまま公開ディレクトリ(public)に出力します。

```
例）
/src/scss/assets/css/style.scss
↓
/public/assets/css/style.css
```

PRECSS を参考にディレクトリを分けています。

```
例）
/src/scss/
  ├─ _component/・・・各ページで使えるパーツを格納
  │    ├─ _button.scss
  │    └─ _text.scss
  │
  ├─ _foundation/・・・設定ファイルを格納
  │    ├─ _mixin.scss・・・mixinや関数等
  │    └─ _var.scss・・・カスタムプロパティ（変数）
  │    └─ _generic.scss・・・リセット用css
  │    └─ _trumps.scss・・・ユーティリティクラス
  │
  └─ _unique・・・各ページ固有のスタイル
       ├─ _top.scss
       └─ _xxx.scss
```

## Picture Mixinの使用方法

このPugのmixinは、`.avif`と`.webp`フォーマットの画像を`<picture>`要素で読み込むためのものです。PCとスマートフォンで異なる画像を使用する場合、または同じ画像を使用する場合の両方に対応しています。

### 使用例

#### 1. PCとスマートフォンで異なる画像を使用する場合

```pug
+picture("/assets/img/top/img-mv1_pc", "/assets/img/top/img-mv1_sp", "代替テキスト", "10", "20")
```

#### 2. PCとスマートフォンで同じ画像を使用する場合

```pug
+picture("/assets/img/top/img-mv1", "代替テキスト", "10", "20")
```

### 引数の説明

+picture() mixinは、次の引数を受け取ります：

1. path：画像のベースパス（拡張子を除く）。
1. alt_text：img要素のalt属性のテキスト。

### 出力HTML

```html
<picture>
  <source media="(min-width: 769px)" srcset="画像パス.avif" type="image/avif">
  <source media="(min-width: 769px)" srcset="画像パス.webp" type="image/webp">
  <source srcset="画像パス.avif" type="image/avif">
  <img src="画像パス.webp" alt="代替テキスト">
</picture>
```
