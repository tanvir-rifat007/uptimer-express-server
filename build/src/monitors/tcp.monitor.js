"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tcpMonitor = void 0;
const monitors_1 = require("./monitors");
const utils_1 = require("../utils/utils");
const monitor_service_1 = require("../services/monitor.service");
const dayjs_1 = __importDefault(require("dayjs"));
const tcp_service_1 = require("../services/tcp.service");
const logger_1 = __importDefault(require("../server/logger"));
class TcpMonitor {
    errorCount;
    noSuccessAlert;
    emailsLocals;
    constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = (0, utils_1.locals)();
    }
    async start(data) {
        const { monitorId, url, port, timeout } = data;
        try {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.emailsLocals.appName = monitorData.name;
            const response = await (0, monitors_1.tcpPing)(url, port, timeout);
            this.assertionCheck(response, monitorData);
        }
        catch (error) {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.tcpError(monitorData, error);
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
        const respTime = JSON.parse(monitorData.responseTime);
        if (monitorData.connection !== response.status ||
            respTime < response.responseTime) {
            this.errorCount += 1;
            heartbeatData = {
                ...heartbeatData,
                status: 1,
                message: "Failed tcp response assertion",
                code: 500,
            };
            await Promise.all([
                (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
                (0, tcp_service_1.createTcpHeartBeat)(heartbeatData),
            ]);
            logger_1.default.info(`TCP heartbeat failed assertions: Monitor ID ${monitorData.id}`);
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
                (0, tcp_service_1.createTcpHeartBeat)(heartbeatData),
            ]);
            logger_1.default.info(`TCP heartbeat success: Monitor ID ${monitorData.id}`);
            if (!this.noSuccessAlert) {
                this.errorCount = 0;
                this.noSuccessAlert = true;
                (0, utils_1.emailSender)(monitorData.notifications.emails, "successStatus", this.emailsLocals);
            }
        }
    }
    async tcpError(monitorData, error) {
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        const heartbeatData = {
            monitorId: monitorData.id,
            status: 1,
            code: error.code,
            message: error && error.message ? error.message : "TCP heartbeat failed",
            timestamp,
            responseTime: error.responseTime,
            connection: error.status,
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, tcp_service_1.createTcpHeartBeat)(heartbeatData),
        ]);
        logger_1.default.info(`TCP heartbeat failed: Monitor ID ${monitorData.id}`);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
    }
}
exports.tcpMonitor = new TcpMonitor();
//# sourceMappingURL=tcp.monitor.js.map