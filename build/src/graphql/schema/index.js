"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergedGQLSchema = void 0;
// vinno vinno file theke schema gula import kore merge korbo ei mergeTypeDefs er maddhome
const merge_1 = require("@graphql-tools/merge");
const user_scheme_1 = require("./user.scheme");
const notification_scheme_1 = require("./notification.scheme");
const monitor_scheme_1 = require("./monitor.scheme");
const heartbeat_schema_1 = require("./heartbeat.schema");
const ssl_1 = require("./ssl");
exports.mergedGQLSchema = (0, merge_1.mergeTypeDefs)([
    user_scheme_1.userSchema,
    notification_scheme_1.notificationSchema,
    monitor_scheme_1.monitorSchema,
    heartbeat_schema_1.heartbeatSchema,
    ssl_1.sslMonitorSchema,
]);
//# sourceMappingURL=index.js.map