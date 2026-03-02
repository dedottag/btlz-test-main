/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("tariffs_box_daily", (table) => {
        table.bigIncrements("id").primary();
        table.date("day_date").notNullable();
        table.string("warehouse_key").notNullable();
        table.string("warehouse_name").notNullable();
        table.string("warehouse_id");
        table.string("coef_field").notNullable();
        table.decimal("coef_value", 18, 6);
        table.jsonb("payload").notNullable();
        table.timestamp("source_fetched_at", { useTz: true }).notNullable();
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(["day_date", "warehouse_key"]);
        table.index(["day_date"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTable("tariffs_box_daily");
}
