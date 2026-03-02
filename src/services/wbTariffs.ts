import env from "#config/env/env.js";
import { logger } from "#services/logger.js";
import { getDayDate } from "#services/date.js";

export type WBTariffItem = Record<string, unknown>;

export type WBTariffsPayload = {
    data?: {
        warehouseList?: WBTariffItem[];
        dtNextBox?: string;
        dtTillMax?: string;
    };
    response?: {
        data?: {
            warehouseList?: WBTariffItem[];
            dtNextBox?: string;
            dtTillMax?: string;
        };
    };
    warehouseList?: WBTariffItem[];
};

export type WBTariffsResult = {
    payload: WBTariffsPayload | WBTariffItem[];
    items: WBTariffItem[];
};

const DEFAULT_TARIFFS_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";

export async function fetchWbTariffs(): Promise<WBTariffsResult> {
    if (!env.WB_API_TOKEN) {
        throw new Error("WB_API_TOKEN is not set");
    }

    const url = env.WB_TARIFFS_URL ?? DEFAULT_TARIFFS_URL;
    const requestUrl = appendDateParam(url, getDayDate(env.APP_TIMEZONE));
    const response = await fetch(requestUrl, {
        headers: {
            Authorization: env.WB_API_TOKEN,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`WB API request failed: ${response.status} ${response.statusText}. ${body}`);
    }

    const payload = (await response.json()) as WBTariffsPayload | WBTariffItem[];
    const items = extractItems(payload);

    logger.info(`WB tariffs fetched: ${items.length} warehouse rows`);

    return { payload, items };
}

function extractItems(payload: WBTariffsPayload | WBTariffItem[]): WBTariffItem[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data?.warehouseList)) {
        return payload.data.warehouseList;
    }

    if (Array.isArray(payload?.response?.data?.warehouseList)) {
        return payload.response.data.warehouseList;
    }

    if (Array.isArray(payload?.warehouseList)) {
        return payload.warehouseList;
    }

    return [];
}

export function resolveWarehouseKey(item: WBTariffItem): { key: string; name: string; id?: string } {
    const name =
        String(
            item.warehouseName ??
                item.warehouse_name ??
                item.warehouse ??
                item.name ??
                item.warehouseTitle ??
                "unknown",
        ) ?? "unknown";

    const idRaw = item.warehouseId ?? item.warehouse_id ?? item.warehouseID ?? item.id ?? null;
    const id = idRaw ? String(idRaw) : undefined;
    const key = id ?? name;

    return { key, name, id };
}

export function resolveCoefficient(item: WBTariffItem, preferredField?: string): { field: string; value: number | null } {
    if (preferredField && preferredField in item) {
        return { field: preferredField, value: parseCoef(item[preferredField]) };
    }

    const entries = Object.entries(item);
    const coefEntry = entries.find(([key, value]) => /coef/i.test(key) && isParsable(value));

    if (coefEntry) {
        return { field: coefEntry[0], value: parseCoef(coefEntry[1]) };
    }

    return { field: preferredField ?? "coef", value: null };
}

function isParsable(value: unknown): boolean {
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") return /\d/.test(value);
    return false;
}

function parseCoef(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.replace(",", ".").replace(/[^0-9.+-]/g, "");
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function appendDateParam(baseUrl: string, date: string): string {
    const url = new URL(baseUrl);
    if (!url.searchParams.get("date")) {
        url.searchParams.set("date", date);
    }
    return url.toString();
}
