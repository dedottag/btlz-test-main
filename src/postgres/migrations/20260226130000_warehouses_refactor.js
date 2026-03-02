/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("warehouses", (table) => {
        table.string("warehouse_key").primary();
        table.string("warehouse_name").notNullable();
        table.string("warehouse_id");
        table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(["warehouse_id"]);
    });

    await knex.raw(`
        insert into warehouses (warehouse_key, warehouse_name, warehouse_id, updated_at, created_at)
        select distinct warehouse_key, warehouse_name, warehouse_id, now(), now()
        from tariffs_box_daily
        where warehouse_key is not null
    `);

    await knex.schema.alterTable("tariffs_box_daily", (table) => {
        table
            .foreign("warehouse_key")
            .references("warehouse_key")
            .inTable("warehouses")
            .onUpdate("CASCADE")
            .onDelete("RESTRICT");
        table.index(["day_date", "coef_value"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.alterTable("tariffs_box_daily", (table) => {
        table.dropIndex(["day_date", "coef_value"]);
        table.dropForeign(["warehouse_key"]);
    });

    await knex.schema.dropTable("warehouses");
}
