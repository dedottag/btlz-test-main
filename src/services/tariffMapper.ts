import { resolveCoefficient, resolveWarehouseKey, type WBTariffItem } from "#services/wbTariffs.js";
import type { TariffRowInsert } from "#services/tariffsRepository.js";

export type TariffDailyRecord = {
    day_date: string;
    warehouse_key: string;
    warehouse_name: string;
    warehouse_id?: string;
    coef_field: string;
    coef_value: number | null;
};

export function mapWbItemsToTariffRows(
    items: WBTariffItem[],
    dayDate: string,
    fetchedAt: Date,
    preferredCoefField?: string,
): TariffRowInsert[] {
    return items.map((item) => {
        const { key, name, id } = resolveWarehouseKey(item);
        const { field, value } = resolveCoefficient(item, preferredCoefField);

        return {
            day_date: dayDate,
            warehouse_key: key,
            warehouse_name: name,
            warehouse_id: id,
            coef_field: field,
            coef_value: value,
            payload: item,
            source_fetched_at: fetchedAt,
            updated_at: fetchedAt,
        };
    });
}

export function mapTariffsToSheetRows(records: TariffDailyRecord[]): Record<string, unknown>[] {
    return records.map((record) => ({
        day_date: record.day_date,
        warehouse_name: record.warehouse_name,
        warehouse_id: record.warehouse_id,
        coef_field: record.coef_field,
        coef_value: record.coef_value,
    }));
}
