declare module "node-cron" {
    export type Task = {
        start: () => void;
        stop: () => void;
        destroy: () => void;
    };

    export function schedule(expression: string, func: () => void): Task;

    const cron: {
        schedule: typeof schedule;
    };

    export default cron;
}
