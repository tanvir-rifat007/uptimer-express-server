"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uptimeMonitorResolver = exports.pubSub = void 0;
const logger_1 = __importDefault(require("../../server/logger"));
const monitor_service_1 = require("../../services/monitor.service");
const notification_service_1 = require("../../services/notification.service");
const jobs_1 = require("../../utils/jobs");
const utils_1 = require("../../utils/utils");
const lodash_1 = require("lodash");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const monitors_1 = require("../../monitors/monitors");
exports.pubSub = new graphql_subscriptions_1.PubSub();
exports.uptimeMonitorResolver = {
    Query: {
        async getSingleMonitor(_parent, { monitorId }, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const result = await (0, monitors_1.getCertificateInfo)("https://facebook.com");
            console.log(result);
            const monitor = await (0, monitor_service_1.getMonitorById)(+monitorId);
            return {
                monitors: [monitor],
            };
        },
        async getUserMonitors(_, { userId }, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const monitors = await (0, monitor_service_1.getUserMonitors)(+userId);
            return {
                monitors,
            };
        },
        async autoRefresh(_parent, { userId, refresh }, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            if (refresh) {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: true,
                };
                (0, jobs_1.startSingleJob)(`${(0, lodash_1.toLower)(req.currentUser?.username)}`, utils_1.appTimeZone, 10, async () => {
                    const monitors = await (0, monitor_service_1.getUserActiveMonitors)(+userId);
                    exports.pubSub.publish("MONITORS_UPDATED", {
                        monitorsUpdated: {
                            userId: +userId,
                            monitors,
                        },
                    });
                });
            }
            else {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: false,
                };
                (0, jobs_1.stopSingleBackgroundJob)(`${(0, lodash_1.toLower)(req.currentUser?.username)}`);
            }
            return {
                refresh,
            };
        },
    },
    Mutation: {
        async createMonitor(_parent, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const body = args.monitor;
            const monitor = await (0, monitor_service_1.createMonitor)(body);
            if (monitor?.active && body?.active) {
                (0, monitor_service_1.startCreatedMonitors)(monitor, (0, lodash_1.toLower)(body.name), body.type);
            }
            return {
                userId: monitor.userId,
                monitors: [monitor],
            };
        },
        async toggleMonitor(_parent, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId, name, active } = args.monitor;
            const monitor = await (0, monitor_service_1.toggleMonitor)(monitorId, userId, active);
            const hasActiveMonitors = (0, lodash_1.some)(monitor, (m) => m.active);
            if (!hasActiveMonitors) {
                req.session = {
                    ...req.session,
                    enableAutomaticRefresh: false,
                };
                (0, jobs_1.stopSingleBackgroundJob)(`${(0, lodash_1.toLower)(req.currentUser?.username)}`);
            }
            if (!active) {
                logger_1.default.info(`Monitor ${name} is inactive`);
                (0, jobs_1.stopSingleBackgroundJob)(name, monitorId);
            }
            else {
                (0, utils_1.resumeMonitors)(monitorId);
            }
            return {
                monitors: monitor,
            };
        },
        async updateMonitor(_, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId, monitor } = args;
            const monitors = await (0, monitor_service_1.updateSingleMonitor)(parseInt(`${monitorId}`), parseInt(`${userId}`), monitor);
            return {
                monitors,
            };
        },
        async deleteMonitor(_parent, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { monitorId, userId, type } = args;
            await (0, monitor_service_1.deleteSingleMonitor)(parseInt(`${monitorId}`), parseInt(`${userId}`), type);
            return {
                id: monitorId,
            };
        },
    },
    MonitorResult: {
        lastChanged: (monitor) => JSON.stringify(monitor.lastChanged),
        responseTime: (monitor) => {
            return monitor.responseTime
                ? parseInt(`${monitor.responseTime}`)
                : monitor.responseTime;
        },
        notifications: (monitor) => {
            return (0, notification_service_1.getSingleNotificationGroup)(monitor.notificationId);
        },
        heartbeats: async (monitor) => {
            const heartbeats = await (0, monitor_service_1.getHeartbeats)(monitor.type, monitor.id, 24);
            return heartbeats.slice(0, 16);
        },
        uptime: async (monitor) => {
            const heartbeats = await (0, monitor_service_1.getHeartbeats)(monitor.type, monitor.id, 24);
            return (0, utils_1.uptimePercentage)(heartbeats);
        },
    },
    Subscription: {
        monitorsUpdated: {
            subscribe: () => exports.pubSub.asyncIterator(["MONITORS_UPDATED"]),
        },
    },
};
//# sourceMappingURL=monitor.resolver.js.map