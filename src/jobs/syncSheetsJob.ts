import { LOCK_IDS, withAdvisoryLock } from "#services/dbLocks.js";
import { getDayDate } from "#services/date.js";
import { updateTariffsSheet } from "#services/googleSheets.js";
import { logger } from "#services/logger.js";
import { listSpreadsheetIds, listTariffsForDate, upsertSpreadsheetIds } from "#services/tariffsRepository.js";
import { mapTariffsToSheetRows } from "#services/tariffMapper.js";
import type { SchedulerState } from "#jobs/types.js";

type SyncSheetsJobDeps = {
    timeZone?: string;
    rawSpreadsheetIds?: string;
    listSpreadsheetIds: typeof listSpreadsheetIds;
    listTariffsForDate: typeof listTariffsForDate;
    upsertSpreadsheetIds: typeof upsertSpreadsheetIds;
    updateSheet: typeof updateTariffsSheet;
    mapRows: typeof mapTariffsToSheetRows;
};

export class SyncSheetsJob {
    private inProgress = false;
    private readonly deps: SyncSheetsJobDeps;

    constructor(deps: Partial<SyncSheetsJobDeps> = {}) {
        this.deps = {
            timeZone: deps.timeZone,
            rawSpreadsheetIds: deps.rawSpreadsheetIds,
            listSpreadsheetIds: deps.listSpreadsheetIds ?? listSpreadsheetIds,
            listTariffsForDate: deps.listTariffsForDate ?? listTariffsForDate,
            upsertSpreadsheetIds: deps.upsertSpreadsheetIds ?? upsertSpreadsheetIds,
            updateSheet: deps.updateSheet ?? updateTariffsSheet,
            mapRows: deps.mapRows ?? mapTariffsToSheetRows,
        };
    }

    async warmupSpreadsheetIds(): Promise<void> {
        const ids = parseSpreadsheetIds(this.deps.rawSpreadsheetIds ?? "");
        if (ids.length === 0) return;
        await this.deps.upsertSpreadsheetIds(ids);
    }

    async run(state: SchedulerState): Promise<void> {
        if (this.inProgress) {
            logger.warn("Sheet sync already in progress; skipping");
            return;
        }

        this.inProgress = true;
        try {
            await withAdvisoryLock(LOCK_IDS.syncSheets, "sync sheets", async () => {
                await this.warmupSpreadsheetIds();
                const spreadsheetIds = await this.deps.listSpreadsheetIds();
                if (spreadsheetIds.length === 0) {
                    logger.warn("No spreadsheet IDs configured; skipping sheet sync");
                    return;
                }

                const dayDate = getDayDate(this.deps.timeZone);
                const tariffs = await this.deps.listTariffsForDate(dayDate);
                const rows = this.deps.mapRows(tariffs);

                for (const spreadsheetId of spreadsheetIds) {
                    await this.deps.updateSheet(spreadsheetId, rows);
                }

                state.lastSheetsSyncAt = new Date();
            });
        } catch (error) {
            logger.error("Failed to sync sheets", error);
        } finally {
            this.inProgress = false;
        }
    }
}

function parseSpreadsheetIds(raw: string): string[] {
    return raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
}
