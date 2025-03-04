"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpMonitor = void 0;
const logger_1 = __importDefault(require("../server/logger"));
const http_service_1 = require("../services/http.service");
const monitor_service_1 = require("../services/monitor.service");
const utils_1 = require("../utils/utils");
const axios_1 = __importDefault(require("axios"));
const dayjs_1 = __importDefault(require("dayjs"));
class HttpMonitor {
    errorCount;
    noSuccessAlert;
    emailsLocals;
    constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = (0, utils_1.locals)();
    }
    async start(data) {
        const { monitorId, httpAuthMethod, basicAuthUser, basicAuthPass, url, method, headers, body, timeout, redirects, bearerToken, } = data;
        const reqTimeout = timeout * 1000;
        const startTime = Date.now();
        try {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.emailsLocals.appName = monitorData.name;
            let basicAuthHeader = {};
            if (httpAuthMethod === "basic") {
                basicAuthHeader = {
                    Authorization: `Basic ${(0, utils_1.encodeBase64)(basicAuthUser, basicAuthPass)}`,
                };
            }
            if (httpAuthMethod === "token") {
                basicAuthHeader = {
                    Authorization: `Bearer ${bearerToken}`,
                };
            }
            let bodyValue = null;
            let reqContentType = null;
            if (body && body.length > 0) {
                try {
                    bodyValue = JSON.parse(body);
                    reqContentType = "application/json";
                }
                catch (error) {
                    throw new Error("Your JOSN body is invalid");
                }
            }
            const options = {
                url,
                method: (method || "get").toLowerCase(),
                timeout: reqTimeout,
                headers: {
                    Accept: "text/html,application/json",
                    ...(reqContentType ? { "Content-Type": reqContentType } : {}),
                    ...basicAuthHeader,
                    ...(headers ? JSON.parse(headers) : {}),
                },
                maxRedirects: redirects,
                ...(bodyValue && {
                    data: bodyValue,
                }),
            };
            const response = await axios_1.default.request(options);
            const responseTime = Date.now() - startTime;
            let heartbeatData = {
                monitorId: monitorId,
                status: 0,
                code: response.status ?? 0,
                message: `${response.status} - ${response.statusText}` ||
                    "Http monitor check successful.",
                timestamp: dayjs_1.default.utc().valueOf(),
                reqHeaders: JSON.stringify(response.headers) ?? "",
                resHeaders: JSON.stringify(response.request.res.rawHeaders) ?? "",
                reqBody: body,
                resBody: JSON.stringify(response.data) ?? "",
                responseTime,
            };
            const statusList = JSON.parse(monitorData.statusCode);
            const responseDurationTime = JSON.parse(monitorData.responseTime);
            const contentTypeList = monitorData.contentType.length > 0
                ? JSON.parse(JSON.stringify(monitorData.contentType))
                : [];
            if (!statusList.includes(response.status) ||
                responseDurationTime < responseTime ||
                (contentTypeList.length > 0 &&
                    !contentTypeList.includes(response.headers["content-type"]))) {
                heartbeatData = {
                    ...heartbeatData,
                    status: 1,
                    message: "Failed http response assertion",
                    code: 500,
                };
                this.errorAssertionCheck(monitorData, heartbeatData);
            }
            else {
                this.successAssertionCheck(monitorData, heartbeatData);
            }
        }
        catch (error) {
            const monitorData = await (0, monitor_service_1.getMonitorById)(monitorId);
            this.httpError(monitorId, startTime, monitorData, error);
        }
    }
    async errorAssertionCheck(monitorData, heartbeatData) {
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, http_service_1.createHttpHeartBeat)(heartbeatData),
        ]);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
        logger_1.default.info(`HTTP heartbeat failed assertions: Monitor ID ${monitorData.id}`);
    }
    async successAssertionCheck(monitorData, heartbeatData) {
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, heartbeatData.timestamp, "success"),
            (0, http_service_1.createHttpHeartBeat)(heartbeatData),
        ]);
        if (!this.noSuccessAlert) {
            this.errorCount = 0;
            this.noSuccessAlert = true;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "successStatus", this.emailsLocals);
        }
        logger_1.default.info(`HTTP heartbeat success: Monitor ID ${monitorData.id}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async httpError(monitorId, startTime, monitorData, error) {
        logger_1.default.info(`HTTP heartbeat failed: Monitor ID ${monitorData.id}`);
        this.errorCount += 1;
        const timestamp = dayjs_1.default.utc().valueOf();
        const heartbeatData = {
            monitorId: monitorId,
            status: 1,
            code: error.response ? error.response.status : 500,
            message: error.response
                ? `${error.response.status} - ${error.response.statusText}`
                : "Http monitor error",
            timestamp,
            reqHeaders: error.response ? JSON.stringify(error.response.headers) : "",
            resHeaders: error.response
                ? JSON.stringify(error.response.request.res.rawHeaders)
                : "",
            reqBody: "",
            resBody: error.response ? JSON.stringify(error.response.data) : "",
            responseTime: Date.now() - startTime,
        };
        await Promise.all([
            (0, monitor_service_1.updateMonitorStatus)(monitorData, timestamp, "failure"),
            (0, http_service_1.createHttpHeartBeat)(heartbeatData),
        ]);
        if (monitorData.alertThreshold > 0 &&
            this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            (0, utils_1.emailSender)(monitorData.notifications.emails, "errorStatus", this.emailsLocals);
        }
    }
}
exports.httpMonitor = new HttpMonitor();
//# sourceMappingURL=http.monitor.js.map