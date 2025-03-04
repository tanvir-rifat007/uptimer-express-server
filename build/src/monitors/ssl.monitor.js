"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sslMonitor = void 0;
const monitors_1 = require("./monitors");
const utils_1 = require("../utils/utils");
const ssl_service_1 = require("../services/ssl.service");
const logger_1 = __importDefault(require("../server/logger"));
class SSLMonitor {
    errorCount;
    constructor() {
        this.errorCount = 0;
    }
    async start(data) {
        const { monitorId, url } = data;
        const emailLocals = (0, utils_1.locals)();
        try {
            const monitorData = await (0, ssl_service_1.getSSLMonitorById)(monitorId);
            emailLocals.appName = monitorData.name;
            const response = await (0, monitors_1.getCertificateInfo)(url);
            await (0, ssl_service_1.updateSSLMonitorInfo)(parseInt(`${monitorId}`), JSON.stringify(response));
            logger_1.default.info(`SSL certificate for "${url}" is valid`);
        }
        catch (error) {
            logger_1.default.error(`SSL certificate for "${url}" has issues`);
            const monitorData = await (0, ssl_service_1.getSSLMonitorById)(monitorId);
            this.errorCount += 1;
            await (0, ssl_service_1.updateSSLMonitorInfo)(parseInt(`${monitorId}`), JSON.stringify(error));
            if (monitorData.alertThreshold > 0 &&
                this.errorCount > monitorData.alertThreshold) {
                this.errorCount = 0;
                (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", emailLocals);
            }
        }
    }
}
exports.sslMonitor = new SSLMonitor();
//# sourceMappingURL=ssl.monitor.js.map