const express = require("express");
const next = require("next");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(
    "/resonite/assets/",
    createProxyMiddleware({
      target: "https://assets.resonite.com/",
      changeOrigin: true,
      logger: console,
      pathRewrite: function (path, req) {
        let newPath = path.replace("/resonite/assets/", "");
        console.log(newPath);
        return newPath;
      },
      on: {
        // アセットはハッシュで識別され内容が変わらないので、ブラウザに長くキャッシュさせる
        proxyRes: (proxyRes) => {
          if (proxyRes.statusCode === 200) {
            proxyRes.headers["cache-control"] =
              "public, max-age=31536000, immutable";
          }
        },
      },
    })
  );

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
