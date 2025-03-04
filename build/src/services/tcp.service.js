"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tcpStatusMonitor = exports.getTcpHeartBeatsByDuration = exports.createTcpHeartBeat = void 0;
const tcp_model_1 = require("../models/tcp.model");
const tcp_monitor_1 = require("../monitors/tcp.monitor");
const jobs_1 = require("../utils/jobs");
const utils_1 = require("../utils/utils");
const dayjs_1 = __importDefault(require("dayjs"));
const sequelize_1 = require("sequelize");
const createTcpHeartBeat = async (data) => {
    try {
        const result = await tcp_model_1.TcpModel.create(data);
        return result.dataValues;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.createTcpHeartBeat = createTcpHeartBeat;
const getTcpHeartBeatsByDuration = async (monitorId, duration = 24) => {
    try {
        const dateTime = dayjs_1.default.utc().toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartbeats = (await tcp_model_1.TcpModel.findAll({
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
        return heartbeats;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.getTcpHeartBeatsByDuration = getTcpHeartBeatsByDuration;
const tcpStatusMonitor = (monitor, name) => {
    const tcpMonitorData = {
        monitorId: monitor.id,
        url: monitor.url,
        port: monitor.port,
        timeout: monitor.timeout,
    };
    (0, jobs_1.startSingleJob)(name, utils_1.appTimeZone, monitor.frequency, async () => tcp_monitor_1.tcpMonitor.start(tcpMonitorData));
};
exports.tcpStatusMonitor = tcpStatusMonitor;
//# sourceMappingURL=tcp.service.js.map