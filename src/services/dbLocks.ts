import knex from "#postgres/knex.js";
import { logger } from "#services/logger.js";

export const LOCK_IDS = {
    fetchTariffs: 880001,
    syncSheets: 880002,
} as const;

export async function withAdvisoryLock<T>(lockId: number, jobName: string, task: () => Promise<T>): Promise<T | null> {
    const acquired = await tryAcquireLock(lockId);
    if (!acquired) {
        logger.warn(`${jobName} skipped: lock is already held`);
        return null;
    }

    try {
        return await task();
    } finally {
        await releaseLock(lockId);
    }
}

async function tryAcquireLock(lockId: number): Promise<boolean> {
    const result = await knex.raw("select pg_try_advisory_lock(?) as locked", [lockId]);
    return Boolean(result?.rows?.[0]?.locked);
}

async function releaseLock(lockId: number): Promise<void> {
    const result = await knex.raw("select pg_advisory_unlock(?) as unlocked", [lockId]);
    const unlocked = Boolean(result?.rows?.[0]?.unlocked);
    if (!unlocked) {
        logger.warn(`advisory lock ${lockId} was not held at release time`);
    }
}
