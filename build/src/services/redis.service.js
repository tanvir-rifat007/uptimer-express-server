"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisStatusMonitor = exports.getRedisHeartBeatsByDuration = exports.createRedisHeartBeat = void 0;
const redis_model_1 = require("../models/redis.model");
const redis_monitor_1 = require("../monitors/redis.monitor");
const jobs_1 = require("../utils/jobs");
const utils_1 = require("../utils/utils");
const dayjs_1 = __importDefault(require("dayjs"));
const sequelize_1 = require("sequelize");
const createRedisHeartBeat = async (data) => {
    try {
        const result = await redis_model_1.RedisModel.create(data);
        return result.dataValues;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.createRedisHeartBeat = createRedisHeartBeat;
const getRedisHeartBeatsByDuration = async (monitorId, duration = 24) => {
    try {
        const dateTime = dayjs_1.default.utc().toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartbeats = (await redis_model_1.RedisModel.findAll({
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
exports.getRedisHeartBeatsByDuration = getRedisHeartBeatsByDuration;
const redisStatusMonitor = (monitor, name) => {
    const redisMonitorData = {
        monitorId: monitor.id,
        url: monitor.url,
    };
    (0, jobs_1.startSingleJob)(name, utils_1.appTimeZone, monitor.frequency, async () => redis_monitor_1.redisMonitor.start(redisMonitorData));
};
exports.redisStatusMonitor = redisStatusMonitor;
//# sourceMappingURL=redis.service.js.map