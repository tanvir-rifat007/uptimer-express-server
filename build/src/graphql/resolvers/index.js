"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const heartbeat_resolver_1 = require("./heartbeat.resolver");
const monitor_resolver_1 = require("./monitor.resolver");
const notification_resolver_1 = require("./notification.resolver");
const ssl_resolver_1 = require("./ssl.resolver");
const user_resolver_1 = require("./user.resolver");
exports.resolvers = [
    user_resolver_1.UserResolver,
    notification_resolver_1.notificationResolver,
    monitor_resolver_1.uptimeMonitorResolver,
    heartbeat_resolver_1.heartbeatResolver,
    ssl_resolver_1.SSLMonitorResolver,
];
//# sourceMappingURL=index.js.map