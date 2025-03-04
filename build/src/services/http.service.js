"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpStatusMonitor = exports.getHttpHeartBeatsByDuration = exports.createHttpHeartBeat = void 0;
const http_model_1 = require("../models/http.model");
const http_monitor_1 = require("../monitors/http.monitor");
const jobs_1 = require("../utils/jobs");
const utils_1 = require("../utils/utils");
const dayjs_1 = __importDefault(require("dayjs"));
const sequelize_1 = require("sequelize");
const createHttpHeartBeat = async (data) => {
    try {
        const result = await http_model_1.HttpModel.create(data);
        return result.dataValues;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.createHttpHeartBeat = createHttpHeartBeat;
const getHttpHeartBeatsByDuration = async (monitorId, duration = 24) => {
    try {
        const dateTime = dayjs_1.default.utc().toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartBeats = (await http_model_1.HttpModel.findAll({
            raw: true,
            where: {
                [sequelize_1.Op.and]: [
                    { monitorId },
                    {
                        timestamp: {
                            [sequelize_1.Op.gte]: dateTime,
                        },
                    },
                ],
            },
            order: [["timestamp", "DESC"]],
        }));
        return heartBeats;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getHttpHeartBeatsByDuration = getHttpHeartBeatsByDuration;
const httpStatusMonitor = (monitor, name) => {
    const httpMonitorData = {
        monitorId: monitor.id,
        httpAuthMethod: monitor.httpAuthMethod,
        basicAuthUser: monitor.basicAuthUser,
        basicAuthPass: monitor.basicAuthPass,
        url: monitor.url,
        method: monitor.method,
        headers: monitor.headers,
        body: monitor.body,
        timeout: monitor.timeout,
        redirects: monitor.redirects,
        bearerToken: monitor.bearerToken,
    };
    (0, jobs_1.startSingleJob)(name, utils_1.appTimeZone, monitor.frequency, async () => http_monitor_1.httpMonitor.start(httpMonitorData));
};
exports.httpStatusMonitor = httpStatusMonitor;
//# sourceMappingURL=http.service.js.map