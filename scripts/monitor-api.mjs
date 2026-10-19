const baseUrl = (
  process.env.MONITOR_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const attempts = Number(process.env.MONITOR_ATTEMPTS ?? 5);
const intervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? 2000);
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS ?? 3000);

function validPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

if (
  !validPositiveInteger(attempts) ||
  !validPositiveInteger(intervalMs) ||
  !validPositiveInteger(timeoutMs)
) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Monitoring settings must be positive integers",
    }),
  );
  process.exit(2);
}

const results = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(index) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    });

    const body = await response.text();
    const latencyMs = Date.now() - startedAt;

    let validJson = false;
    let appHealthy = false;

    try {
      const data = JSON.parse(body);
      validJson = true;
      appHealthy = data.status === "ok";
    } catch {
      // A non-JSON response is not considered healthy.
    }

    const healthy =
      response.status === 200 && validJson && appHealthy;

    const result = {
      level: healthy ? "info" : "error",
      event: "health_check",
      attempt: index,
      url: `${baseUrl}/health`,
      httpStatus: response.status,
      latencyMs,
      healthy,
      timestamp: new Date().toISOString(),
    };

    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    const result = {
      level: "error",
      event: "health_check",
      attempt: index,
      url: `${baseUrl}/health`,
      latencyMs: Date.now() - startedAt,
      healthy: false,
      error:
        error.name === "AbortError"
          ? "request_timeout"
          : "request_failed",
      timestamp: new Date().toISOString(),
    };

    results.push(result);
    console.log(JSON.stringify(result));
  } finally {
    clearTimeout(timeout);
  }
}

for (let i = 1; i <= attempts; i++) {
  await checkHealth(i);

  if (i < attempts) {
    await sleep(intervalMs);
  }
}

const healthyCount = results.filter((result) => result.healthy).length;
const failedCount = results.length - healthyCount;
const latencies = results.map((result) => result.latencyMs);
const averageLatencyMs = Math.round(
  latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
);
const sortedLatencies = [...latencies].sort((a, b) => a - b);
const p95Index = Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1);

const summary = {
  event: "monitor_summary",
  totalChecks: results.length,
  healthyChecks: healthyCount,
  failedChecks: failedCount,
  averageLatencyMs,
  maxObservedLatencyMs: Math.max(...latencies),
  p95ObservedLatencyMs: sortedLatencies[p95Index],
  timestamp: new Date().toISOString(),
};

console.log(JSON.stringify(summary));

if (failedCount > 0) {
  process.exitCode = 1;
}
