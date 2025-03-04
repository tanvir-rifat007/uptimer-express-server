"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisMonitor = void 0;
const monitors_1 = require("./monitors");
const utils_1 = require("../utils/utils");
const monitor_service_1 = require("../services/monitor.service");
const dayjs_1 = __importDefault(require("dayjs"));
const redis_service_1 = require("../services/redis.service");
const logger_1 = __importDefault(require("../server/logger"));
class RedisMonitor {
    errorCount;
    noSuccessAlert;
    emailsLocals;
    constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = (0, utils_1.locals)();
    }
    async start(data) {
        const { monitorId, url } = data;
        try {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.emailsLocals.appName = monitorData.name;
            const response = await (0, monitors_1.redisPing)(url);
            this.assertionCheck(response, monitorData);
        }
        catch (error) {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.redisError(monitorData, error);
        }
    }
    async assertionCheck(response, monitorData) {
        const timestamp = dayjs_1.default.utc().valueOf();
        let heartbeatData = {
            monitorId: monitorData.id,
            status: 0,
            code: response.code,
            message: response.message,
            timestamp,
            responseTime: response.responseTime,
            connection: response.status,
        };
        if (monitorData.connection !== response.status) {
            this.errorCount += 1;
            heartbeatData = {
                ...heartbeatData,
                status: 1,
                message: "Failed redis response assertion",
                code: 500,
            };
            await Promise.all([
                (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
                (0, redis_service_1.createRedisHeartBeat)(heartbeatData),
            ]);
            logger_1.default.info(`Redis heartbeat failed assertions: Monitor ID ${monitorData.id}`);
            if (monitorData.alertThreshold > 0 &&
                this.errorCount > monitorData.alertThreshold) {
                this.errorCount = 0;
                this.noSuccessAlert = false;
                (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
            }
        }
        else {
            await Promise.all([
                (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "success"),
                (0, redis_service_1.createRedisHeartBeat)(heartbeatData),
            ]);
            logger_1.default.info(`Redis heartbeat success: Monitor ID ${monitorData.id}`);
            if (!this.noSuccessAlert) {
                this.errorCount = 0;
                this.noSuccessAlert = true;
                (0, utils_1.emailSender)(monitorData.notifications.emails, "successStatus", this.emailsLocals);
            }
        }
    }
    async redisError(monitorData, error) {
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        const heartbeatData = {
            monitorId: monitorData.id,
            status: 1,
            code: error.code,
            message: error && error.message ? error.message : "Redis heartbeat failed",
            timestamp,
            responseTime: error.responseTime,
            connection: error.status,
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, redis_service_1.createRedisHeartBeat)(heartbeatData),
        ]);
        logger_1.default.info(`Redis heartbeat failed: Monitor ID ${monitorData.id}`);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
    }
}
exports.redisMonitor = new RedisMonitor();
//# sourceMappingURL=redis.monitor.js.map