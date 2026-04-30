const express = require("express");

const app = express();
const port = Number(process.env.PORT ?? 3000);
const serverId = process.env.SERVER_ID ?? "backend-1";

app.get("/", (req, res) => {
  res.json({ server: serverId });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend ${serverId} listening on port ${port}`);
});
