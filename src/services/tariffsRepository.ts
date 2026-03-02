import knex from "#postgres/knex.js";
import { logger } from "#services/logger.js";

export type TariffRowInsert = {
    day_date: string;
    warehouse_key: string;
    warehouse_name: string;
    warehouse_id?: string;
    coef_field: string;
    coef_value: number | null;
    payload: Record<string, unknown>;
    source_fetched_at: Date;
    updated_at: Date;
};

export async function upsertTariffs(rows: TariffRowInsert[]): Promise<void> {
    if (rows.length === 0) {
        logger.warn("No tariff rows to upsert");
        return;
    }

    await knex.transaction(async (trx) => {
        const uniqueWarehouses = rows.reduce<
            Array<{ warehouse_key: string; warehouse_name: string; warehouse_id?: string; updated_at: Date }>
        >((acc, row) => {
            if (acc.some((item) => item.warehouse_key === row.warehouse_key)) {
                return acc;
            }

            acc.push({
                warehouse_key: row.warehouse_key,
                warehouse_name: row.warehouse_name,
                warehouse_id: row.warehouse_id,
                updated_at: row.updated_at,
            });
            return acc;
        }, []);

        await trx("warehouses")
            .insert(uniqueWarehouses)
            .onConflict(["warehouse_key"])
            .merge(["warehouse_name", "warehouse_id", "updated_at"]);

        await trx("tariffs_box_daily")
            .insert(rows)
            .onConflict(["day_date", "warehouse_key"])
            .merge([
                "warehouse_name",
                "warehouse_id",
                "coef_field",
                "coef_value",
                "payload",
                "source_fetched_at",
                "updated_at",
            ]);
    });
}

export async function listTariffsForDate(dayDate: string) {
    return knex("tariffs_box_daily")
        .select([
            "day_date",
            "warehouse_key",
            "warehouse_name",
            "warehouse_id",
            "coef_field",
            "coef_value",
        ])
        .where({ day_date: dayDate })
        .orderByRaw("coef_value IS NULL ASC")
        .orderBy([{ column: "coef_value", order: "asc" }, { column: "warehouse_name", order: "asc" }]);
}

export async function upsertSpreadsheetIds(spreadsheetIds: string[]): Promise<void> {
    if (spreadsheetIds.length === 0) return;

    await knex("spreadsheets")
        .insert(spreadsheetIds.map((spreadsheet_id) => ({ spreadsheet_id })))
        .onConflict(["spreadsheet_id"])
        .ignore();
}

export async function listSpreadsheetIds(): Promise<string[]> {
    const rows = await knex("spreadsheets").select(["spreadsheet_id"]);
    return rows.map((row) => row.spreadsheet_id);
}
