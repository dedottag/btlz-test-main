import { LOCK_IDS, withAdvisoryLock } from "#services/dbLocks.js";
import { getDayDate } from "#services/date.js";
import { logger } from "#services/logger.js";
import { upsertTariffs, type TariffRowInsert } from "#services/tariffsRepository.js";
import { mapWbItemsToTariffRows } from "#services/tariffMapper.js";
import { fetchWbTariffs } from "#services/wbTariffs.js";
import type { SchedulerState } from "#jobs/types.js";

type FetchTariffsJobDeps = {
    timeZone?: string;
    preferredCoefField?: string;
    now: () => Date;
    fetchTariffs: typeof fetchWbTariffs;
    mapRows: (items: Record<string, unknown>[], dayDate: string, fetchedAt: Date, preferredCoefField?: string) => TariffRowInsert[];
    upsertRows: typeof upsertTariffs;
};

export class FetchTariffsJob {
    private inProgress = false;
    private readonly deps: FetchTariffsJobDeps;

    constructor(deps: Partial<FetchTariffsJobDeps> = {}) {
        this.deps = {
            timeZone: deps.timeZone,
            preferredCoefField: deps.preferredCoefField,
            now: deps.now ?? (() => new Date()),
            fetchTariffs: deps.fetchTariffs ?? fetchWbTariffs,
            mapRows: deps.mapRows ?? mapWbItemsToTariffRows,
            upsertRows: deps.upsertRows ?? upsertTariffs,
        };
    }

    async run(state: SchedulerState): Promise<void> {
        if (this.inProgress) {
            logger.warn("Fetch already in progress; skipping");
            return;
        }

        this.inProgress = true;
        try {
            await withAdvisoryLock(LOCK_IDS.fetchTariffs, "fetch tariffs", async () => {
                const now = this.deps.now();
                const dayDate = getDayDate(this.deps.timeZone, now);
                const { items } = await this.deps.fetchTariffs();
                const rows = this.deps.mapRows(items, dayDate, now, this.deps.preferredCoefField);

                await this.deps.upsertRows(rows);
                state.lastFetchAt = now;
                logger.info(`Tariffs upserted for ${dayDate}`);
            });
        } catch (error) {
            logger.error("Failed to fetch tariffs", error);
        } finally {
            this.inProgress = false;
        }
    }
}
