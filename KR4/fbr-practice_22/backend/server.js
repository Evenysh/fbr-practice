const http = require("node:http");

const port = Number(process.env.PORT ?? 3000);
const instance = process.env.INSTANCE ?? `backend-${port}`;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, instance, port }));
    return;
  }

  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Response from backend server",
        instance,
        port,
        time: new Date().toISOString(),
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", instance, port }));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started: ${instance} on port ${port}`);
});

