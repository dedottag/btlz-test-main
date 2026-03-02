import { buildValues } from "#services/googleSheets.js";

describe("buildValues", () => {
    it("returns marker when empty", () => {
        expect(buildValues([])).toEqual([["no_data"]]);
    });

    it("keeps stable preferred columns order", () => {
        const values = buildValues([
            {
                warehouse_id: "1",
                coef_value: 2,
                day_date: "2026-02-26",
                coef_field: "boxDeliveryAndStorageCoeff",
                warehouse_name: "North",
            },
        ]);

        expect(values[0]).toEqual(["day_date", "warehouse_name", "warehouse_id", "coef_field", "coef_value"]);
        expect(values[1]).toEqual(["2026-02-26", "North", "1", "boxDeliveryAndStorageCoeff", 2]);
    });
});
