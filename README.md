# Resonite Util Console

[Resonite Util Console](https://util.resonite.love)

[Resonite](https://resonite.com/)に関連した便利機能を作ります。

## Inventory Viewer

[Inventory Viewer](https://util.resonite.love/inventory/v1/top)

パブリックフォルダを閲覧できます。

## Session Viewer

[Session Viewer](https://util.resonite.love/session/v1/top)

参加者がいる公開セッションを一覧できます。

## 開発

```bash
npm ci
npm run dev           # http://localhost:3000
npm run typecheck     # 型チェック
npm run format:check  # Prettier の整形チェック (npm run format で整形)
npm run build
```

PR と main への push では、GitHub Actions で型チェック・整形チェック・ビルドが実行されます。

## Docker で起動する

```bash
docker compose up -d --build
```

http://localhost:3000 で起動します。ホスト側のポートを変える場合は `HOST_PORT` を指定してください（例: `HOST_PORT=8080 docker compose up -d --build`）。
