"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoMonitor = void 0;
const monitors_1 = require("./monitors");
const utils_1 = require("../utils/utils");
const monitor_service_1 = require("../services/monitor.service");
const dayjs_1 = __importDefault(require("dayjs"));
const mongo_service_1 = require("../services/mongo.service");
const logger_1 = __importDefault(require("../server/logger"));
class MongoMonitor {
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
            const response = await (0, monitors_1.mongodbPing)(url);
            if (monitorData.connection !== response.status) {
                this.errorAssertionCheck(response.responseTime, monitorData);
            }
            else {
                this.successAssertionCheck(response, monitorData);
            }
        }
        catch (error) {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.mongoDBError(monitorData, error);
        }
    }
    async errorAssertionCheck(responseTime, monitorData) {
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        const heartbeatData = {
            monitorId: monitorData.id,
            status: 1,
            code: 500,
            message: "Connection status incorrect",
            timestamp,
            responseTime,
            connection: "refused",
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, mongo_service_1.createMongoHeartBeat)(heartbeatData),
        ]);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
        logger_1.default.info(`MONGODB heartbeat failed assertions: Monitor ID ${monitorData.id}`);
    }
    async successAssertionCheck(response, monitorData) {
        const heartbeatData = {
            monitorId: monitorData.id,
            status: 0,
            code: response.code,
            message: response.message,
            timestamp: dayjs_1.default.utc().valueOf(),
            responseTime: response.responseTime,
            connection: response.status,
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, heartbeatData.timestamp, "success"),
            (0, mongo_service_1.createMongoHeartBeat)(heartbeatData),
        ]);
        if (!this.noSuccessAlert) {
            this.errorCount = 0;
            this.noSuccessAlert = true;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "successStatus", this.emailsLocals);
        }
        logger_1.default.info(`MONGODB heartbeat success: Monitor ID ${monitorData.id}`);
    }
    async mongoDBError(monitorData, error) {
        logger_1.default.info(`MONGODB heartbeat failed: Monitor ID ${monitorData.id}`);
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        const heartbeatData = {
            monitorId: monitorData.id,
            status: 1,
            code: error.code,
            message: error.message ?? "MongoDB connection failed",
            timestamp,
            responseTime: error.responseTime,
            connection: error.status,
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, mongo_service_1.createMongoHeartBeat)(heartbeatData),
        ]);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
    }
}
exports.mongoMonitor = new MongoMonitor();
//# sourceMappingURL=mongo.monitor.js.map