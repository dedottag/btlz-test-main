import { getDayDate } from "#services/date.js";

describe("getDayDate", () => {
    it("returns ISO-like date without timezone", () => {
        const date = new Date("2026-02-26T07:07:24.000Z");
        expect(getDayDate(undefined, date)).toBe("2026-02-26");
    });

    it("respects timezone when provided", () => {
        const date = new Date("2026-02-26T23:30:00.000Z");
        expect(getDayDate("Europe/Moscow", date)).toBe("2026-02-27");
    });
});
