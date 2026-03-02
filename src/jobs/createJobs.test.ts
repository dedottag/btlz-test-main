import { createJobs } from "#jobs/createJobs.js";
import { FetchTariffsJob } from "#jobs/fetchTariffsJob.js";
import { SyncSheetsJob } from "#jobs/syncSheetsJob.js";

describe("createJobs", () => {
    it("returns initialized job instances", () => {
        const jobs = createJobs();

        expect(jobs.fetchTariffsJob).toBeInstanceOf(FetchTariffsJob);
        expect(jobs.syncSheetsJob).toBeInstanceOf(SyncSheetsJob);
    });
});
