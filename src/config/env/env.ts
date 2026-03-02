import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production", "test"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value)),
    ]),
    WB_API_TOKEN: z.union([z.undefined(), z.string().min(1)]),
    WB_TARIFFS_URL: z.union([z.undefined(), z.string().url()]),
    FETCH_CRON: z.union([z.undefined(), z.string().min(1)]),
    SHEETS_CRON: z.union([z.undefined(), z.string().min(1)]),
    APP_TIMEZONE: z.union([z.undefined(), z.string().min(1)]),
    LOG_LEVEL: z.union([z.undefined(), z.string().min(1)]),
    GOOGLE_SERVICE_ACCOUNT_JSON: z.union([z.undefined(), z.string().min(1)]),
    GOOGLE_SHEETS_IDS: z.union([z.undefined(), z.string().min(1)]),
    GOOGLE_SHEETS_SHEET_NAME: z.union([z.undefined(), z.string().min(1)]),
    GOOGLE_SHEETS_COEF_FIELD: z.union([z.undefined(), z.string().min(1)]),
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    WB_TARIFFS_URL: process.env.WB_TARIFFS_URL,
    FETCH_CRON: process.env.FETCH_CRON,
    SHEETS_CRON: process.env.SHEETS_CRON,
    APP_TIMEZONE: process.env.APP_TIMEZONE,
    LOG_LEVEL: process.env.LOG_LEVEL,
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    GOOGLE_SHEETS_IDS: process.env.GOOGLE_SHEETS_IDS,
    GOOGLE_SHEETS_SHEET_NAME: process.env.GOOGLE_SHEETS_SHEET_NAME,
    GOOGLE_SHEETS_COEF_FIELD: process.env.GOOGLE_SHEETS_COEF_FIELD,
});

export default env;
