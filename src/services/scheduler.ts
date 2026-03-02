import cron from "node-cron";
import env from "#config/env/env.js";
import { createJobs } from "#jobs/createJobs.js";
import { logger } from "#services/logger.js";
import type { SchedulerState } from "#jobs/types.js";
export type { SchedulerState } from "#jobs/types.js";

const DEFAULT_FETCH_CRON = "0 * * * *";
const DEFAULT_SHEETS_CRON = "10 * * * *";

export async function startScheduler(state: SchedulerState) {
    const { fetchTariffsJob, syncSheetsJob } = createJobs();

    await syncSheetsJob.warmupSpreadsheetIds();

    await fetchTariffsJob.run(state);
    await syncSheetsJob.run(state);

    const fetchCron = env.FETCH_CRON ?? DEFAULT_FETCH_CRON;
    const sheetsCron = env.SHEETS_CRON ?? DEFAULT_SHEETS_CRON;

    cron.schedule(fetchCron, () => void fetchTariffsJob.run(state));
    cron.schedule(sheetsCron, () => void syncSheetsJob.run(state));

    logger.info(`Scheduler started. Fetch cron: ${fetchCron}. Sheets cron: ${sheetsCron}.`);
}
