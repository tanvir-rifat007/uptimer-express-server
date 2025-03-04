"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLMonitorResolver = void 0;
const notification_service_1 = require("../../services/notification.service");
const ssl_service_1 = require("../../services/ssl.service");
const jobs_1 = require("../../utils/jobs");
const utils_1 = require("../../utils/utils");
const lodash_1 = require("lodash");
exports.SSLMonitorResolver = {
    Query: {
        async getSingleSSLMonitor(_, { monitorId }, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const monitor = await (0, ssl_service_1.getSSLMonitorById)(parseInt(monitorId));
            return {
                sslMonitors: [monitor],
            };
        },
        async getUserSSLMonitors(_, { userId }, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const monitors = await (0, ssl_service_1.getUserSSLMonitors)(parseInt(userId));
            return {
                sslMonitors: monitors,
            };
        },
    },
    Mutation: {
        async createSSLMonitor(_, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const body = args.monitor;
            const monitor = await (0, ssl_service_1.createSSLMonitor)(body);
            if (body.active && monitor?.active) {
                (0, ssl_service_1.sslStatusMonitor)(monitor, (0, lodash_1.toLower)(body.name));
            }
            return {
                sslMonitors: [monitor],
            };
        },
        async toggleSSLMonitor(_, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId, name, active } = args.monitor;
            const sslMonitors = await (0, ssl_service_1.toggleSSLMonitor)(monitorId, userId, active);
            if (!active) {
                (0, jobs_1.stopSingleBackgroundJob)(name, monitorId);
            }
            else {
                (0, utils_1.resumeSSLMonitors)(monitorId);
            }
            return {
                sslMonitors,
            };
        },
        async updateSSLMonitor(_, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId, monitor } = args;
            const sslMonitors = await (0, ssl_service_1.updateSingleSSLMonitor)(parseInt(`${monitorId}`), parseInt(`${userId}`), monitor);
            return {
                sslMonitors,
            };
        },
        async deleteSSLMonitor(_, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId } = args;
            await (0, ssl_service_1.deleteSingleSSLMonitor)(parseInt(`${monitorId}`), parseInt(`${userId}`));
            return {
                id: parseInt(`${monitorId}`),
            };
        },
    },
    SSLMonitorResult: {
        notifications: (monitor) => {
            return (0, notification_service_1.getSingleNotificationGroup)(monitor.notificationId);
        },
    },
};
//# sourceMappingURL=ssl.resolver.js.map