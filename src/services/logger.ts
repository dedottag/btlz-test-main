import log4js from "log4js";
import env from "#config/env/env.js";

const level = env.LOG_LEVEL ?? "info";

log4js.configure({
    appenders: {
        out: { type: "stdout" },
    },
    categories: {
        default: { appenders: ["out"], level },
    },
});

export const logger = log4js.getLogger("app");
