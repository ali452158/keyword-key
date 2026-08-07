/**
 * deploy-fix.cjs
 * Deploys the latest "real social media data" fix to the Hostinger VPS.
 *
 * Flow:
 *   1. SSH into 76.13.40.219 as root
 *   2. cd /var/www/keyword-key && git pull origin main
 *      - If git pull fails due to local changes, run `git checkout -- .` then retry
 *   3. bun run db:push  (ensure schema is up to date)
 *   4. bun run build    (rebuild the standalone app — may take 30-60s)
 *   5. pm2 restart keyword-key
 *   6. pm2 status keyword-key  (verify online)
 *   7. curl http://localhost:3001/api/integration/analyze
 *      with POST {"account":"khaby.lame","platform":"tiktok"}
 *      and verify response contains dataSource + meta.needsApiKey
 *
 * Each step prints its output and the script aborts on hard errors.
 */

const { Client } = require("ssh2");

const HOST = "76.13.40.219";
const USER = "root";
const PASS = "Ali@0164569934";
const PORT = 22;

const APP_DIR = "/var/www/keyword-key";
const PM2_NAME = "keyword-key";
const HEALTH_URL = "http://localhost:3001/api/integration/analyze";

// ---------------------------------------------------------------------------
// Helper: run a single shell command on the VPS and stream stdout/stderr back
// Uses the ssh2 callback API: conn.exec(cmd, opts, (err, stream) => ...)
// ---------------------------------------------------------------------------
function runCommand(conn, cmd, { timeoutMs = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`\n>>> ${cmd}\n`);
    conn.exec(cmd, { pty: false }, (err, stream) => {
      if (err) {
        process.stderr.write(`[exec error] ${err.message}\n`);
        reject(err);
        return;
      }

      let stdout = "";
      let stderr = "";

      stream.on("data", (chunk) => {
        const s = chunk.toString();
        stdout += s;
        process.stdout.write(s);
      });
      stream.stderr.on("data", (chunk) => {
        const s = chunk.toString();
        stderr += s;
        process.stderr.write(s);
      });

      const timer = setTimeout(() => {
        process.stderr.write(
          `\n[timeout] command exceeded ${timeoutMs}ms, sending SIGKILL\n`
        );
        try {
          stream.signal("KILL");
        } catch (_) {
          /* ignore */
        }
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`));
      }, timeoutMs);

      stream.on("close", (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal, stdout, stderr });
      });

      stream.on("error", (streamErr) => {
        clearTimeout(timer);
        process.stderr.write(`[stream error] ${streamErr.message}\n`);
        reject(streamErr);
      });
    });
  });
}

// Helper: run curl with a JSON POST body and print the response
function runCurl(conn, url, body) {
  // Use single-quoted JSON payload so it survives the remote shell safely.
  const safeBody = `'${body.replace(/'/g, "'\\''")}'`;
  const cmd = `curl -sS -X POST -H 'Content-Type: application/json' -d ${safeBody} ${url}`;
  return runCommand(conn, cmd);
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------
const conn = new Client();

console.log(`Connecting to ${USER}@${HOST}:${PORT} ...`);

conn.on("ready", async () => {
  console.log("=== Connected to VPS! ===");

  try {
    // ------------------------------------------------------------------
    // STEP 0: sanity check the project dir + locate bun
    // ------------------------------------------------------------------
    await runCommand(
      conn,
      `test -d ${APP_DIR} && echo "APP_DIR exists" || echo "APP_DIR MISSING"`
    );

    // bun is typically in /root/.bun/bin but isn't on PATH for non-interactive
    // SSH sessions. Detect its full path so subsequent commands can use it.
    const bunPathRes = await runCommand(
      conn,
      `command -v bun || ls /root/.bun/bin/bun 2>/dev/null || ls /usr/local/bin/bun 2>/dev/null || ls /usr/bin/bun 2>/dev/null || echo BUN_NOT_FOUND`
    );
    const bunLine = (bunPathRes.stdout || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .find((l) => l && l !== "BUN_NOT_FOUND");
    const BUN = bunLine || "bun";
    console.log(`[info] bun resolved to: ${BUN}`);

    // ------------------------------------------------------------------
    // STEP 1: git pull origin main (with auto-recovery for local changes)
    // ------------------------------------------------------------------
    let pullRes = await runCommand(
      conn,
      `cd ${APP_DIR} && git pull origin main 2>&1`
    );

    // Detect "local changes would be overwritten" / "Your local changes ... would be overwritten"
    const combinedPull = (pullRes.stdout || "") + (pullRes.stderr || "");
    if (
      /local changes|would be overwritten|conflict|merge error|error: Your local changes/i.test(
        combinedPull
      )
    ) {
      console.log(
        "\n[recovery] git pull blocked by local changes — running `git checkout -- .` then retrying"
      );
      await runCommand(conn, `cd ${APP_DIR} && git checkout -- . 2>&1`);
      pullRes = await runCommand(
        conn,
        `cd ${APP_DIR} && git pull origin main 2>&1`
      );
    }

    if (pullRes.code !== 0) {
      throw new Error(
        `git pull failed (exit ${pullRes.code}). See output above.`
      );
    }

    // Show the latest commit hash on the VPS for traceability
    await runCommand(conn, `cd ${APP_DIR} && git log --oneline -3`);

    // ------------------------------------------------------------------
    // STEP 2: bun run db:push (ensure schema matches current code)
    // ------------------------------------------------------------------
    const dbRes = await runCommand(
      conn,
      `cd ${APP_DIR} && ${BUN} run db:push 2>&1`,
      { timeoutMs: 120_000 }
    );
    if (dbRes.code !== 0) {
      // db:push is allowed to be a soft failure (e.g. schema unchanged)
      console.log(
        `\n[warn] bun run db:push exited with code ${dbRes.code} — continuing`
      );
    }

    // ------------------------------------------------------------------
    // STEP 3: bun run build (rebuild the standalone Next.js app)
    // ------------------------------------------------------------------
    const buildRes = await runCommand(
      conn,
      `cd ${APP_DIR} && ${BUN} run build 2>&1`,
      { timeoutMs: 300_000 }
    );
    if (buildRes.code !== 0) {
      throw new Error(
        `bun run build failed (exit ${buildRes.code}). See output above.`
      );
    }

    // ------------------------------------------------------------------
    // STEP 4: pm2 restart keyword-key
    // ------------------------------------------------------------------
    const restartRes = await runCommand(
      conn,
      `pm2 restart ${PM2_NAME} --update-env 2>&1`,
      { timeoutMs: 60_000 }
    );
    if (restartRes.code !== 0) {
      throw new Error(
        `pm2 restart failed (exit ${restartRes.code}). See output above.`
      );
    }

    // Give PM2 / Next.js a moment to bind to port 3001
    console.log("\n[wait] giving the app 5s to bind to port 3001 ...");
    await new Promise((r) => setTimeout(r, 5000));

    // ------------------------------------------------------------------
    // STEP 5: pm2 status keyword-key (verify online)
    // ------------------------------------------------------------------
    const statusRes = await runCommand(conn, `pm2 status ${PM2_NAME} 2>&1`);
    if (statusRes.code !== 0) {
      throw new Error(
        `pm2 status failed (exit ${statusRes.code}). See output above.`
      );
    }

    // ------------------------------------------------------------------
    // STEP 6: health-check the API on port 3001
    // ------------------------------------------------------------------
    console.log(
      `\n[verify] POST ${HEALTH_URL} with {"account":"khaby.lame","platform":"tiktok"}`
    );
    const curlRes = await runCurl(
      conn,
      HEALTH_URL,
      JSON.stringify({ account: "khaby.lame", platform: "tiktok" })
    );
    const responseBody = (curlRes.stdout || "").trim();

    let parsed = null;
    try {
      parsed = JSON.parse(responseBody);
    } catch (e) {
      console.log(
        `[warn] API response was not valid JSON — raw body:\n${responseBody}`
      );
    }

    if (parsed) {
      const hasDataSource =
        parsed.data && typeof parsed.data.dataSource !== "undefined";
      const hasNeedsApiKey =
        parsed.meta && typeof parsed.meta.needsApiKey !== "undefined";
      console.log(
        `\n[verify] data.dataSource present?  → ${hasDataSource}` +
          (hasDataSource ? ` (value: ${parsed.data.dataSource})` : "")
      );
      console.log(
        `[verify] meta.needsApiKey present? → ${hasNeedsApiKey}` +
          (hasNeedsApiKey ? ` (value: ${parsed.meta.needsApiKey})` : "")
      );
      if (hasDataSource && hasNeedsApiKey) {
        console.log(
          "\n=== VERIFICATION PASSED: API returns the new dataSource + meta.needsApiKey fields ==="
        );
      } else {
        console.log(
          "\n=== VERIFICATION WARNING: response is missing one or both expected fields ==="
        );
      }
    }

    console.log("\n=== DEPLOY COMPLETE ===");
    conn.end();
  } catch (err) {
    console.error("\n=== DEPLOY FAILED ===");
    console.error(err && err.message ? err.message : err);
    // Still try to fetch PM2 status so we know the current state
    try {
      await runCommand(conn, `pm2 status ${PM2_NAME} 2>&1`);
    } catch (_) {
      /* ignore */
    }
    conn.end();
    process.exitCode = 1;
  }
});

conn.on("error", (err) => {
  console.error(`[ssh error] ${err.message}`);
  process.exit(1);
});

conn.on("close", () => {
  console.log("\nConnection closed.");
});

conn.connect({
  host: HOST,
  port: PORT,
  username: USER,
  password: PASS,
  readyTimeout: 30_000,
  algorithms: {
    serverKey: [
      "ssh-rsa",
      "ssh-ed25519",
      "ecdsa-sha2-nistp256",
      "ecdsa-sha2-nistp384",
      "ecdsa-sha2-nistp521",
      "ssh-dss",
    ],
    kex: [
      "ecdh-sha2-nistp256",
      "ecdh-sha2-nistp384",
      "ecdh-sha2-nistp521",
      "diffie-hellman-group14-sha256",
      "diffie-hellman-group14-sha1",
      "diffie-hellman-group1-sha1",
    ],
  },
});
