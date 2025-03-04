"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sslStatusMonitor = exports.deleteSingleSSLMonitor = exports.updateSSLMonitorInfo = exports.updateSingleSSLMonitor = exports.toggleSSLMonitor = exports.getSSLMonitorById = exports.getAllUsersActiveSSLMonitors = exports.getUserActiveSSLMonitors = exports.getUserSSLMonitors = exports.createSSLMonitor = void 0;
const ssl_model_1 = require("../models/ssl.model");
const jobs_1 = require("../utils/jobs");
const utils_1 = require("../utils/utils");
const sequelize_1 = require("sequelize");
const notification_service_1 = require("./notification.service");
const ssl_monitor_1 = require("../monitors/ssl.monitor");
const createSSLMonitor = async (data) => {
    try {
        const result = await ssl_model_1.SSLModel.create(data);
        return result.dataValues;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.createSSLMonitor = createSSLMonitor;
const getUserSSLMonitors = async (userId, active) => {
    try {
        const monitors = (await ssl_model_1.SSLModel.findAll({
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
    catch (error) {
        throw new Error(error);
    }
};
exports.getUserSSLMonitors = getUserSSLMonitors;
const getUserActiveSSLMonitors = async (userId) => {
    try {
        const monitors = await (0, exports.getUserSSLMonitors)(userId, true);
        return monitors;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.getUserActiveSSLMonitors = getUserActiveSSLMonitors;
const getAllUsersActiveSSLMonitors = async () => {
    try {
        const monitors = (await ssl_model_1.SSLModel.findAll({
            raw: true,
            where: { active: true },
            order: [["createdAt", "DESC"]],
        }));
        return monitors;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.getAllUsersActiveSSLMonitors = getAllUsersActiveSSLMonitors;
const getSSLMonitorById = async (monitorId) => {
    try {
        const monitor = (await ssl_model_1.SSLModel.findOne({
            raw: true,
            where: { id: monitorId },
        }));
        let updatedMonitor = { ...monitor };
        const notifications = await (0, notification_service_1.getSingleNotificationGroup)(updatedMonitor.notificationId);
        updatedMonitor = { ...updatedMonitor, notifications };
        return updatedMonitor;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.getSSLMonitorById = getSSLMonitorById;
const toggleSSLMonitor = async (monitorId, userId, active) => {
    try {
        await ssl_model_1.SSLModel.update({ active }, {
            where: {
                [sequelize_1.Op.and]: [{ id: monitorId }, { userId }],
            },
        });
        const result = await (0, exports.getUserSSLMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.toggleSSLMonitor = toggleSSLMonitor;
const updateSingleSSLMonitor = async (monitorId, userId, data) => {
    try {
        await ssl_model_1.SSLModel.update(data, {
            where: { id: monitorId },
        });
        const result = await (0, exports.getUserSSLMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.updateSingleSSLMonitor = updateSingleSSLMonitor;
const updateSSLMonitorInfo = async (monitorId, infoData) => {
    try {
        await ssl_model_1.SSLModel.update({ info: infoData }, {
            where: { id: monitorId },
        });
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.updateSSLMonitorInfo = updateSSLMonitorInfo;
const deleteSingleSSLMonitor = async (monitorId, userId) => {
    try {
        await ssl_model_1.SSLModel.destroy({
            where: { id: monitorId },
        });
        const result = await (0, exports.getUserSSLMonitors)(userId);
        return result;
    }
    catch (error) {
        throw new Error(error);
    }
};
exports.deleteSingleSSLMonitor = deleteSingleSSLMonitor;
const sslStatusMonitor = (monitor, name) => {
    const sslData = {
        monitorId: monitor.id,
        url: monitor.url,
    };
    (0, jobs_1.startSingleJob)(name, utils_1.appTimeZone, monitor.frequency, async () => ssl_monitor_1.sslMonitor.start(sslData));
};
exports.sslStatusMonitor = sslStatusMonitor;
//# sourceMappingURL=ssl.service.js.map