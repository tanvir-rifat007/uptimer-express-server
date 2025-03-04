"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locals = exports.emailSender = exports.enableAutoRefreshJob = exports.getDaysRemaining = exports.getDaysBetween = exports.resumeSSLMonitors = exports.resumeMonitors = exports.startSSLMonitors = exports.startMonitors = exports.uptimePercentage = exports.getRandomInt = exports.sleep = exports.authenticateGraphQLRoute = exports.encodeBase64 = exports.isEmail = exports.appTimeZone = void 0;
const monitor_resolver_1 = require("../graphql/resolvers/monitor.resolver");
const monitor_service_1 = require("../services/monitor.service");
const graphql_1 = require("graphql");
const jsonwebtoken_1 = require("jsonwebtoken");
const lodash_1 = require("lodash");
const jobs_1 = require("./jobs");
const config_1 = require("../server/config");
const email_1 = require("./email");
const ssl_service_1 = require("../services/ssl.service");
// get a user's current time zone:
exports.appTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const isEmail = (email) => {
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    return regexExp.test(email);
};
exports.isEmail = isEmail;
const encodeBase64 = (user, pass) => {
    return Buffer.from(`${user}:${pass}`).toString("base64");
};
exports.encodeBase64 = encodeBase64;
const authenticateGraphQLRoute = async (req) => {
    const token = req.session?.jwt;
    if (!token) {
        throw new graphql_1.GraphQLError("You are not authenticated");
    }
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_TOKEN);
        req.currentUser = decoded;
    }
    catch (err) {
        throw new graphql_1.GraphQLError("You are not authenticated");
    }
};
exports.authenticateGraphQLRoute = authenticateGraphQLRoute;
const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
exports.sleep = sleep;
const getRandomInt = (max, min) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.getRandomInt = getRandomInt;
const uptimePercentage = (heartbeats) => {
    if (!heartbeats) {
        return 0;
    }
    const totalHeartbeats = heartbeats.length;
    const downtimeHeartbeats = heartbeats.filter((heartbeat) => heartbeat.status === 1).length;
    return (Math.round(((totalHeartbeats - downtimeHeartbeats) / totalHeartbeats) * 100) || 0);
};
exports.uptimePercentage = uptimePercentage;
const startMonitors = async () => {
    const list = await (0, monitor_service_1.getAllUserActiveMonitors)();
    for (const monitor of list) {
        // start monitor
        (0, monitor_service_1.startCreatedMonitors)(monitor, (0, lodash_1.toLower)(monitor.name), monitor.type);
        // sleep
        await (0, exports.sleep)((0, exports.getRandomInt)(300, 1000));
    }
};
exports.startMonitors = startMonitors;
const startSSLMonitors = async () => {
    const list = await (0, ssl_service_1.getAllUsersActiveSSLMonitors)();
    for (const monitor of list) {
        (0, ssl_service_1.sslStatusMonitor)(monitor, (0, lodash_1.toLower)(monitor.name));
        await (0, exports.sleep)((0, exports.getRandomInt)(300, 1000));
    }
};
exports.startSSLMonitors = startSSLMonitors;
const resumeMonitors = async (monitorId) => {
    const monitor = await (0, monitor_service_1.getMonitorById)(monitorId);
    (0, monitor_service_1.startCreatedMonitors)(monitor, (0, lodash_1.toLower)(monitor.name), monitor.type);
    await (0, exports.sleep)((0, exports.getRandomInt)(300, 1000));
};
exports.resumeMonitors = resumeMonitors;
const resumeSSLMonitors = async (monitorId) => {
    const monitor = await (0, ssl_service_1.getSSLMonitorById)(monitorId);
    (0, ssl_service_1.sslStatusMonitor)(monitor, (0, lodash_1.toLower)(monitor.name));
    await (0, exports.sleep)((0, exports.getRandomInt)(300, 1000));
};
exports.resumeSSLMonitors = resumeSSLMonitors;
const getDaysBetween = (start, end) => {
    return Math.round(Math.abs(+start - +end) / (1000 * 60 * 60 * 24));
};
exports.getDaysBetween = getDaysBetween;
const getDaysRemaining = (start, end) => {
    const daysRemaining = (0, exports.getDaysBetween)(start, end);
    if (new Date(end).getTime() < new Date().getTime()) {
        return -daysRemaining;
    }
    return daysRemaining;
};
exports.getDaysRemaining = getDaysRemaining;
const enableAutoRefreshJob = (cookies) => {
    const result = getCookies(cookies);
    const session = Buffer.from(result.session, "base64").toString();
    const payload = (0, jsonwebtoken_1.verify)(JSON.parse(session).jwt, config_1.JWT_TOKEN);
    const enableAutoRefresh = JSON.parse(session).enableAutomaticRefresh;
    console.log("enabledAutoRefresh", enableAutoRefresh);
    if (enableAutoRefresh) {
        (0, jobs_1.startSingleJob)(`${(0, lodash_1.toLower)(payload.username)}`, exports.appTimeZone, 10, async () => {
            const monitors = await (0, monitor_service_1.getUserActiveMonitors)(payload.id);
            monitor_resolver_1.pubSub.publish("MONITORS_UPDATED", {
                monitorsUpdated: {
                    userId: payload.id,
                    monitors,
                },
            });
        });
    }
};
exports.enableAutoRefreshJob = enableAutoRefreshJob;
const getCookies = (cookie) => {
    const cookies = {};
    cookie.split(";").forEach((cookieData) => {
        const parts = cookieData.match(/(.*?)=(.*)$/);
        cookies[parts[1].trim()] = (parts[2] || "").trim();
    });
    return cookies;
};
const emailSender = async (notificationEmails, template, locals) => {
    const emails = JSON.parse(notificationEmails);
    for (const email of emails) {
        await (0, email_1.sendEmail)(template, email, locals);
    }
};
exports.emailSender = emailSender;
const locals = () => {
    return {
        appLink: `${config_1.CLIENT_URL}`,
        appIcon: "https://ibb.com/jD45fqX",
        appName: "",
    };
};
exports.locals = locals;
//# sourceMappingURL=utils.js.map