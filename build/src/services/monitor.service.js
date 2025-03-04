"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSingleMonitor = exports.startCreatedMonitors = exports.getHeartbeats = exports.updateMonitorStatus = exports.updateSingleMonitor = exports.toggleMonitor = exports.getMonitorById = exports.getAllUserActiveMonitors = exports.getUserActiveMonitors = exports.getUserMonitors = exports.createMonitor = void 0;
const monitor_model_1 = require("../models/monitor.model");
const sequelize_1 = require("sequelize");
const notification_service_1 = require("./notification.service");
const dayjs_1 = __importDefault(require("dayjs"));
const http_service_1 = require("./http.service");
const lodash_1 = require("lodash");
const utils_1 = require("../utils/utils");
const http_model_1 = require("../models/http.model");
const mongodb_model_1 = require("../models/mongodb.model");
const mongo_service_1 = require("./mongo.service");
const redis_model_1 = require("../models/redis.model");
const redis_service_1 = require("./redis.service");
const tcp_model_1 = require("../models/tcp.model");
const tcp_service_1 = require("./tcp.service");
const HTTP_TYPE = "http";
const TCP_TYPE = "tcp";
const MONGO_TYPE = "mongodb";
const REDIS_TYPE = "redis";
/**
 * Create a new monitor
 * @param  data - Monitor data
 * @returns {Promise<IMonitorDocument>}
 */
const createMonitor = async (data) => {
    try {
        const result = await monitor_model_1.MonitorModel.create(data);
        return result.dataValues;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.createMonitor = createMonitor;
/**
 * Get all monitors(active and inactive) or just active for a user
 * @param userId number
 * @param active boolean?
 * @returns {Promise<IMonitorDocument>}
 */
const getUserMonitors = async (userId, active) => {
    try {
        const monitors = (await monitor_model_1.MonitorModel.findAll({
            raw: true,
            where: {
                [sequelize_1.Op.and]: [
                    {
                        userId,
                        ...(active && {
                            active: true,
                        }),
                    },
                ],
            },
            order: [["createdAt", "DESC"]],
        }));
        return monitors;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getUserMonitors = getUserMonitors;
/**
 * Returns all active monitors for a user
 * @param userId number
 * @returns {Promise<IMonitorDocument[]>}
 */
const getUserActiveMonitors = async (userId) => {
    try {
        let heartbeats = [];
        const updatedMonitors = [];
        const monitors = await (0, exports.getUserMonitors)(userId, true);
        for (let monitor of monitors) {
            const group = await (0, notification_service_1.getSingleNotificationGroup)(monitor.notificationId);
            heartbeats = await (0, exports.getHeartbeats)(monitor.type, monitor.id, 24);
            const uptime = (0, utils_1.uptimePercentage)(heartbeats);
            monitor = {
                ...monitor,
                heartbeats: heartbeats.slice(0, 16),
                uptime,
                notifications: group,
            };
            updatedMonitors.push(monitor);
        }
        return updatedMonitors;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getUserActiveMonitors = getUserActiveMonitors;
/**
 * Returns all active monitors for all users
 * @returns {Promise<IMonitorDocument[]>}
 */
const getAllUserActiveMonitors = async () => {
    try {
        const monitors = (await monitor_model_1.MonitorModel.findAll({
            raw: true,
            where: {
                active: true,
            },
            order: [["createdAt", "DESC"]],
        }));
        return monitors;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getAllUserActiveMonitors = getAllUserActiveMonitors;
const getMonitorById = async (monitorId) => {
    try {
        const monitor = (await monitor_model_1.MonitorModel.findOne({
            raw: true,
            where: {
                id: monitorId,
            },
        }));
        let updatedMonitor = { ...monitor };
        const notifications = await (0, notification_service_1.getSingleNotificationGroup)(updatedMonitor.notificationId);
        updatedMonitor = {
            ...updatedMonitor,
            notifications,
        };
        return updatedMonitor;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getMonitorById = getMonitorById;
const toggleMonitor = async (monitorId, userId, active) => {
    try {
        await monitor_model_1.MonitorModel.update({ active }, {
            where: {
                [sequelize_1.Op.and]: [{ id: monitorId }, { userId }],
            },
        });
        const result = await (0, exports.getUserMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.toggleMonitor = toggleMonitor;
/**
 * Update single monitor
 * @param monitorId
 * @param userId
 * @param data
 * @returns {Promise<IMonitorDocument[]>}
 */
const updateSingleMonitor = async (monitorId, userId, data) => {
    try {
        await monitor_model_1.MonitorModel.update(data, {
            where: { id: monitorId },
        });
        const result = await (0, exports.getUserMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.updateSingleMonitor = updateSingleMonitor;
/**
 * Update monitor status
 * @param monitor
 * @param timestamp
 * @param type
 * @returns {Promise<IMonitorDocument>}
 */
const updateMonitorStatus = async (monitor, timestamp, type) => {
    try {
        const now = timestamp ? (0, dayjs_1.default)(timestamp).toDate() : (0, dayjs_1.default)().toDate();
        const { id, status } = monitor;
        const updatedMonitor = { ...monitor };
        updatedMonitor.status = type === "success" ? 0 : 1;
        const isStatus = type === "success" ? true : false;
        if (isStatus && status === 1) {
            updatedMonitor.lastChanged = now;
        }
        else if (!isStatus && status === 0) {
            updatedMonitor.lastChanged = now;
        }
        await monitor_model_1.MonitorModel.update(updatedMonitor, { where: { id } });
        return updatedMonitor;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.updateMonitorStatus = updateMonitorStatus;
const getHeartbeats = async (type, monitorId, duration) => {
    let heartbeats = [];
    if (type === HTTP_TYPE) {
        heartbeats = await (0, http_service_1.getHttpHeartBeatsByDuration)(monitorId, duration);
    }
    return heartbeats;
};
exports.getHeartbeats = getHeartbeats;
const startCreatedMonitors = (monitor, name, type) => {
    if (type === HTTP_TYPE) {
        (0, http_service_1.httpStatusMonitor)(monitor, `${(0, lodash_1.toLower)(name)}`);
    }
    if (type === TCP_TYPE) {
        (0, tcp_service_1.tcpStatusMonitor)(monitor, `${(0, lodash_1.toLower)(name)}`);
    }
    if (type === MONGO_TYPE) {
        (0, mongo_service_1.mongoStatusMonitor)(monitor, `${(0, lodash_1.toLower)(name)}`);
    }
    if (type === REDIS_TYPE) {
        (0, redis_service_1.redisStatusMonitor)(monitor, `${(0, lodash_1.toLower)(name)}`);
    }
};
exports.startCreatedMonitors = startCreatedMonitors;
/**
 * Delete a single monitor with its associated heartbeats
 * @param monitorId
 * @param userId
 * @param type
 * @returns {Promise<IMonitorDocument[]>}
 */
const deleteSingleMonitor = async (monitorId, userId, type) => {
    console.log(type);
    try {
        // deleting associated heartbeats
        await deleteMonitorTypeHeartbeats(monitorId, type);
        await monitor_model_1.MonitorModel.destroy({
            where: { id: monitorId },
        });
        const result = await (0, exports.getUserMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.deleteSingleMonitor = deleteSingleMonitor;
const deleteMonitorTypeHeartbeats = async (monitorId, type) => {
    let model = null;
    if (type === HTTP_TYPE) {
        model = http_model_1.HttpModel;
    }
    if (type === MONGO_TYPE) {
        model = mongodb_model_1.MongoModel;
    }
    if (type === REDIS_TYPE) {
        model = redis_model_1.RedisModel;
    }
    if (type === TCP_TYPE) {
        model = tcp_model_1.TcpModel;
    }
    if (model) {
        await model.destroy({
            where: { monitorId },
        });
    }
};
//# sourceMappingURL=monitor.service.js.map