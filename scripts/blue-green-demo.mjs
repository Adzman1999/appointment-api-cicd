import http from "node:http";

const PORTS = {
  blue: 8101,
  green: 8102,
};

let activeColor = "blue";
let greenHealthy = true;

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function createVersionServer(color, port) {
  return http.createServer((req, res) => {
    if (req.url === "/health") {
      const healthy = color !== "green" || greenHealthy;

      return sendJson(res, healthy ? 200 : 503, {
        status: healthy ? "ok" : "unhealthy",
        version: color,
      });
    }

    if (req.url === "/version") {
      return sendJson(res, 200, {
        version: color,
        message: `Response from ${color.toUpperCase()}`,
      });
    }

    return sendJson(res, 404, { error: "Not found" });
  }).listen(port, "127.0.0.1", () => {
    console.log(`${color.toUpperCase()} listening on ${port}`);
  });
}

const blueServer = createVersionServer("blue", PORTS.blue);
const greenServer = createVersionServer("green", PORTS.green);

const proxyServer = http.createServer((req, res) => {
  if (req.url === "/switch/blue" || req.url === "/switch/green") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Use POST" });
    }

    const target = req.url.endsWith("/green") ? "green" : "blue";
    activeColor = target;

    return sendJson(res, 200, {
      message: `Traffic switched to ${target}`,
      activeVersion: activeColor,
    });
  }

  if (req.url === "/simulate-failure/green") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Use POST" });
    }

    greenHealthy = false;

    return sendJson(res, 200, {
      message: "Green is now unhealthy for demo purposes",
    });
  }

  if (req.url === "/reset-demo") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Use POST" });
    }

    activeColor = "blue";
    greenHealthy = true;

    return sendJson(res, 200, {
      message: "Demo reset",
      activeVersion: activeColor,
      greenHealthy,
    });
  }

  const targetPort = PORTS[activeColor];
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", () => {
    sendJson(res, 502, { error: "Upstream unavailable" });
  });

  req.pipe(upstream);
});

proxyServer.listen(8100, "127.0.0.1", () => {
  console.log("Traffic router listening on http://127.0.0.1:8100");
  console.log("Initial active version: blue");
});

function shutdown() {
  console.log("\nStopping blue-green demo...");
  proxyServer.close();
  blueServer.close();
  greenServer.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
