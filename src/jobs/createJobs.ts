import env from "#config/env/env.js";
import { FetchTariffsJob } from "#jobs/fetchTariffsJob.js";
import { SyncSheetsJob } from "#jobs/syncSheetsJob.js";

export type AppJobs = {
    fetchTariffsJob: FetchTariffsJob;
    syncSheetsJob: SyncSheetsJob;
};

export function createJobs(): AppJobs {
    const fetchTariffsJob = new FetchTariffsJob({
        timeZone: env.APP_TIMEZONE,
        preferredCoefField: env.GOOGLE_SHEETS_COEF_FIELD ?? undefined,
    });

    const syncSheetsJob = new SyncSheetsJob({
        timeZone: env.APP_TIMEZONE,
        rawSpreadsheetIds: env.GOOGLE_SHEETS_IDS,
    });

    return {
        fetchTariffsJob,
        syncSheetsJob,
    };
}
