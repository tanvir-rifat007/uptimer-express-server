"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heartbeatResolver = void 0;
const monitor_service_1 = require("../../services/monitor.service");
const utils_1 = require("../../utils/utils");
exports.heartbeatResolver = {
    Query: {
        async getHeartbeats(_parent, args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            const { type, monitorId, duration } = args;
            const heartbeats = await (0, monitor_service_1.getHeartbeats)(type, +monitorId, +duration);
            return {
                heartbeats,
            };
        },
    },
    HeartBeat: {
        timestamp: (heartbeat) => JSON.stringify(heartbeat.timestamp),
    },
};
//# sourceMappingURL=heartbeat.resolver.js.map