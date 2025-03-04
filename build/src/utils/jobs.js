"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopSingleBackgroundJob = exports.startSingleJob = void 0;
const logger_1 = __importDefault(require("../server/logger"));
const croner_1 = require("croner");
const lodash_1 = require("lodash");
const jobs = [
    {
        name: "Every 10 seconds",
        type: 10,
        interval: "*/10 * * * * *",
    },
    {
        name: "Every 30 seconds",
        type: 30,
        interval: "*/30 * * * * *",
    },
    {
        name: "Every 1 minute",
        type: 60,
        interval: "* */1 * * *",
    },
    {
        name: "Every 5 minutes",
        type: 300,
        interval: "*/5 * * * *",
    },
    {
        name: "Every 15 minutes",
        type: 900,
        interval: "*/15 * * * *",
    },
    {
        name: "Every 30 minutes",
        type: 1800,
        interval: "*/15 * * * *",
    },
    {
        name: "Every 1 hour",
        type: 3600,
        interval: "0 * * * *",
    },
    {
        name: "Every 24 hours",
        type: 86400,
        interval: "0 0 * * *",
    },
    {
        name: "Every 5 days",
        type: 432000,
        interval: "0 0 */5 * *",
    },
    {
        name: "Every 7 days",
        type: 604800,
        interval: "0 0 */7 * *",
    },
    {
        name: "Every 15 days",
        type: 1.296e6,
        interval: "0 0 */15 * *",
    },
    {
        name: "Every 30 days",
        type: 2.592e6,
        interval: "0 0 */30 * *",
    },
];
/**
 * Initialize single background job
 * @param name
 * @param timezone
 * @param type
 * @param jobFunc
 */
const startSingleJob = (name, timezone, type, jobFunc) => {
    // jekono  job er name scheduleJobs array te ache kina check korbe
    const scheduled = croner_1.scheduledJobs.find((job) => (0, lodash_1.toLower)(job.name) === (0, lodash_1.toLower)(name));
    if (!scheduled) {
        const job = jobs.find((data) => data.type === type);
        (0, croner_1.Cron)(job.interval, {
            name,
            timezone,
        }, jobFunc);
    }
};
exports.startSingleJob = startSingleJob;
/**
 * Stop single background job
 * @param name
 * @param monitorId
 */
const stopSingleBackgroundJob = (name, monitorId) => {
    const scheduled = croner_1.scheduledJobs.find((job) => (0, lodash_1.toLower)(job.name) === (0, lodash_1.toLower)(name));
    if (scheduled) {
        scheduled.stop();
        if (monitorId) {
            logger_1.default.info(`Stopped cron job for monitor with ID ${monitorId} and name ${name}`);
        }
        else {
            logger_1.default.info(`Stopped cron job for ${name}`);
        }
    }
};
exports.stopSingleBackgroundJob = stopSingleBackgroundJob;
//# sourceMappingURL=jobs.js.map