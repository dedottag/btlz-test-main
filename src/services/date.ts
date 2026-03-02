export function getDayDate(timeZone?: string, date = new Date()): string {
    if (!timeZone) {
        return date.toISOString().slice(0, 10);
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
        return date.toISOString().slice(0, 10);
    }

    return `${year}-${month}-${day}`;
}
