import { resolveCoefficient, resolveWarehouseKey } from "#services/wbTariffs.js";

describe("resolveWarehouseKey", () => {
    it("prefers warehouse id as key", () => {
        const result = resolveWarehouseKey({ warehouseName: "Kolya", warehouseId: 101 });
        expect(result).toEqual({ key: "101", name: "Kolya", id: "101" });
    });

    it("falls back to warehouse name", () => {
        const result = resolveWarehouseKey({ warehouseName: "South Hub" });
        expect(result).toEqual({ key: "South Hub", name: "South Hub", id: undefined });
    });
});

describe("resolveCoefficient", () => {
    it("uses preferred field when present", () => {
        const result = resolveCoefficient({ boxDeliveryAndStorageCoeff: "12,5" }, "boxDeliveryAndStorageCoeff");
        expect(result).toEqual({ field: "boxDeliveryAndStorageCoeff", value: 12.5 });
    });

    it("falls back to coef-like field", () => {
        const result = resolveCoefficient({ someCoef: "8" });
        expect(result).toEqual({ field: "someCoef", value: 8 });
    });

    it("returns null when no parsable value", () => {
        const result = resolveCoefficient({ someValue: "n/a" }, "boxDeliveryAndStorageCoeff");
        expect(result).toEqual({ field: "boxDeliveryAndStorageCoeff", value: null });
    });
});
