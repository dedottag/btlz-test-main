import { mapTariffsToSheetRows, mapWbItemsToTariffRows } from "#services/tariffMapper.js";

describe("mapWbItemsToTariffRows", () => {
    it("maps wb items into db rows", () => {
        const now = new Date("2026-03-01T16:58:12.000Z");
        const rows = mapWbItemsToTariffRows(
            [
                {
                    warehouseName: "North",
                    warehouseId: 10,
                    boxDeliveryAndStorageCoeff: "4,5",
                },
            ],
            "2026-03-01",
            now,
            "boxDeliveryAndStorageCoeff",
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual({
            day_date: "2026-03-01",
            warehouse_key: "10",
            warehouse_name: "North",
            warehouse_id: "10",
            coef_field: "boxDeliveryAndStorageCoeff",
            coef_value: 4.5,
            payload: {
                warehouseName: "North",
                warehouseId: 10,
                boxDeliveryAndStorageCoeff: "4,5",
            },
            source_fetched_at: now,
            updated_at: now,
        });
    });
});

describe("mapTariffsToSheetRows", () => {
    it("returns compact rows for sheets", () => {
        const rows = mapTariffsToSheetRows([
            {
                day_date: "2026-03-01",
                warehouse_key: "10",
                warehouse_name: "North",
                warehouse_id: "10",
                coef_field: "boxDeliveryAndStorageCoeff",
                coef_value: 4.5,
            },
        ]);

        expect(rows).toEqual([
            {
                day_date: "2026-03-01",
                warehouse_name: "North",
                warehouse_id: "10",
                coef_field: "boxDeliveryAndStorageCoeff",
                coef_value: 4.5,
            },
        ]);
    });
});
