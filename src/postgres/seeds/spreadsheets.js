/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function seed(knex) {
    const rawIds = process.env.GOOGLE_SHEETS_IDS ?? "";
    const spreadsheetIds = rawIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    if (spreadsheetIds.length === 0) {
        return;
    }

    await knex("spreadsheets")
        .insert(spreadsheetIds.map((spreadsheet_id) => ({ spreadsheet_id })))
        .onConflict(["spreadsheet_id"])
        .ignore();
}
