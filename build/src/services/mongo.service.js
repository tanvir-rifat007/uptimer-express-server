"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoStatusMonitor = exports.getMongoHeartBeatsByDuration = exports.createMongoHeartBeat = void 0;
const mongodb_model_1 = require("../models/mongodb.model");
const mongo_monitor_1 = require("../monitors/mongo.monitor");
const jobs_1 = require("../utils/jobs");
const utils_1 = require("../utils/utils");
const dayjs_1 = __importDefault(require("dayjs"));
const sequelize_1 = require("sequelize");
const createMongoHeartBeat = async (data) => {
    try {
        const result = await mongodb_model_1.MongoModel.create(data);
        return result.dataValues;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.createMongoHeartBeat = createMongoHeartBeat;
const getMongoHeartBeatsByDuration = async (monitorId, duration = 24) => {
    try {
        const dateTime = dayjs_1.default.utc().toDate();
        dateTime.setHours(dateTime.getHours() - duration);
        const heartbeats = (await mongodb_model_1.MongoModel.findAll({
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
exports.getMongoHeartBeatsByDuration = getMongoHeartBeatsByDuration;
const mongoStatusMonitor = (monitor, name) => {
    const mongoMonitorData = {
        monitorId: monitor.id,
        url: monitor.url,
    };
    (0, jobs_1.startSingleJob)(name, utils_1.appTimeZone, monitor.frequency, async () => mongo_monitor_1.mongoMonitor.start(mongoMonitorData));
};
exports.mongoStatusMonitor = mongoStatusMonitor;
//# sourceMappingURL=mongo.service.js.map