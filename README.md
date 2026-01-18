# Minecraft Discord Bot

DiscordからMinecraftサーバー（Java版・統合版）を起動・管理できるBot。プレイヤーが不在の場合、自動でサーバーを停止する（はず）。

## 機能

- 🎮 `/server` コマンドでサーバー起動ボタンを表示
- 🟢 統合版サーバーの起動・管理
- 🔴 Java版サーバーの起動・管理
- 📊 10分ごとのプレイヤー数監視
- 🛑 プレイヤー0人の場合の自動停止

## 前提条件

- **Node.js** 18.x 以上
- **npm** または **yarn**
- Discordアカウントとサーバー（ギルド）
- Minecraftサーバー（Java版・統合版）

## セットアップ手順

### 1. Node.jsのインストール確認

```powershell
node --version
npm --version
```

### 2. パッケージのインストール

```powershell
npm install
```

### 3. Discord Botの作成

[Discord Bot セットアップガイド](file:///C:/Users/yuta7/.gemini/antigravity/brain/7dfdb19c-eef1-4a57-9248-3ae93a5a7310/discord_bot_setup_guide.md) を参照して、以下の情報を取得してください：

- Discord Bot Token
- Application ID (Client ID)

### 4. 環境変数の設定

`.env.example` を `.env` にコピーして、取得した情報を入力してね：

```powershell
copy .env.example .env
```

`.env` ファイルを編集：

```env
DISCORD_BOT_TOKEN=あなたのボットトークン
CLIENT_ID=あなたのクライアントID
```

> [!NOTE]
> このBotはグローバルコマンドを使用するため、`GUILD_ID`は不要です。コマンドは全サーバーで使用できますが、反映に最大1時間かかる場合があるかも？

### 5. サーバー設定の確認

`config.json` を開いて、サーバーのパスとアドレスが正しいか確認すること：

```json
{
  "javaServer": {
    "command": "起動できるbatファイルのパス",
    "host": "tomekun.ddns.net",
    "port": 25565
  },
  "bedrockServer": {
    "command": "起動できるbatファイルのパス",
    "host": "tomekun.ddns.net",
    "port": 19132
  },
  "checkIntervalMinutes": 10
}
```

### 6. スラッシュコマンドの登録

初回のみ実行が必要（deploy-commands.jsを変更したら実行してね）：

```powershell
node deploy-commands.js
```

成功すると「✅ スラッシュコマンドの登録が完了しました！」と表示する

### 7. Botの起動

```powershell
node bot.js
```

または

```powershell
npm start
```

成功すると「✅ Botが起動しました: [ボット名]」と表示される

## 使い方

1. Discord サーバーで `/server` コマンドを入力
2. 緑色のボタン（統合版）または赤色のボタン（Java）をクリック
3. サーバーが起動します
4. プレイヤーが10分間不在の場合、自動的にサーバーが停止

## トラブルシューティング

### スラッシュコマンドが表示されない

- `node deploy-commands.js` を実行したか確認
- Discordアプリを再起動
- 数分待ってから再度確認

### サーバーが起動しない

- `config.json` のパスが正しいか確認
- batファイル/exeファイルが存在するか確認
- 手動でbatファイル/exeを実行して動作するか確認

### プレイヤー数が取得できない

- Minecraftサーバーが実際に起動しているか確認
- `config.json` のホストとポートが正しいか確認
- Java版の場合、`server.properties` で `enable-query=true` に設定

### Botがオフラインになる

- `.env` ファイルのトークンが正しいか確認
- Bot Tokenをリセットして再取得

## 設定のカスタマイズ

### プレイヤー監視の間隔を変更

`config.json` の `checkIntervalMinutes` を変更：

```json
{
  "checkIntervalMinutes": 5  // 5分に変更
}
```

### サーバーアドレスの変更

`config.json` の `host` と `port` を変更：

```json
{
  "javaServer": {
    "host": "新しいアドレス",
    "port": 25565
  }
}
```

## ファイル構成

```
DMSL/
├── bot.js                    # メインBotファイル
├── deploy-commands.js        # コマンド登録スクリプト
├── config.json               # サーバー設定
├── package.json              # npm設定
├── .env                      # 環境変数（自分で作成）
├── .env.example              # 環境変数サンプル
└── README.md                 # このファイル
```

## ライセンス

MIT

## サポート

問題が発生した場合は、以下を確認してね：

1. Node.jsのバージョン
2. `.env` ファイルの内容
3. `config.json` の設定
4. Minecraftサーバーが手動で起動できるか
5. コンソールのエラーメッセージ
