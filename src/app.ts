import http from "node:http";
import env from "#config/env/env.js";
import { migrate, seed } from "#postgres/knex.js";
import { logger } from "#services/logger.js";
import { startScheduler, type SchedulerState } from "#services/scheduler.js";

await migrate.latest();
await seed.run();

const state: SchedulerState = {};
await startScheduler(state);

const port = env.APP_PORT ?? 5000;

const server = http.createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                status: "ok",
                lastFetchAt: state.lastFetchAt ?? null,
                lastSheetsSyncAt: state.lastSheetsSyncAt ?? null,
            }),
        );
        return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WB tariffs worker is running");
});

server.listen(port, () => logger.info(`HTTP server listening on ${port}`));
