import { google } from "googleapis";
import env from "#config/env/env.js";
import { logger } from "#services/logger.js";

export type SheetRow = Record<string, unknown>;

export async function updateTariffsSheet(spreadsheetId: string, rows: SheetRow[]): Promise<void> {
    const credentials = parseServiceAccount();
    if (!credentials) {
        logger.warn("Google credentials are missing; skipping sheet update");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetName = env.GOOGLE_SHEETS_SHEET_NAME ?? "stocks_coefs";
    const values = buildValues(rows);
    const rowCount = values.length;
    const colCount = values[0]?.length ?? 1;
    const lastColumn = toColumnName(colCount);
    const writeRange = `${sheetName}!A1:${lastColumn}${rowCount}`;
    const previousRows = await getSheetRowCount(sheets, spreadsheetId, sheetName);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: writeRange,
        valueInputOption: "RAW",
        requestBody: { values },
    });

    if (previousRows > rowCount) {
        const clearFrom = rowCount + 1;
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${sheetName}!A${clearFrom}:${lastColumn}${previousRows}`,
        });
    }

    logger.info(`Google sheet updated: ${spreadsheetId} (${rows.length} rows)`);
}

export function buildValues(rows: SheetRow[]): (string | number | null)[][] {
    if (rows.length === 0) {
        return [["no_data"]];
    }

    const columnSet = new Set<string>();
    for (const row of rows) {
        Object.keys(row).forEach((key) => columnSet.add(key));
    }

    const preferredColumns = ["day_date", "warehouse_name", "warehouse_id", "coef_field", "coef_value"];
    const columns = [
        ...preferredColumns.filter((column) => columnSet.has(column)),
        ...Array.from(columnSet).filter((column) => !preferredColumns.includes(column)).sort(),
    ];

    return [columns, ...rows.map((row) => columns.map((key) => normalizeCell(row[key])))] as (string | number | null)[][];
}

function normalizeCell(value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;
    return JSON.stringify(value);
}

function parseServiceAccount(): Record<string, unknown> | null {
    const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw || raw === "replace_me") return null;

    try {
        if (raw.trim().startsWith("{")) {
            return JSON.parse(raw) as Record<string, unknown>;
        }

        const decoded = Buffer.from(raw, "base64").toString("utf8");
        return JSON.parse(decoded) as Record<string, unknown>;
    } catch (error) {
        logger.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", error);
        return null;
    }
}

async function getSheetRowCount(
    sheets: ReturnType<typeof google.sheets>,
    spreadsheetId: string,
    sheetName: string,
): Promise<number> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
    });
    return response.data.values?.length ?? 0;
}

function toColumnName(columnIndex: number): string {
    let value = columnIndex;
    let result = "";

    while (value > 0) {
        const rem = (value - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        value = Math.floor((value - 1) / 26);
    }

    return result || "A";
}
