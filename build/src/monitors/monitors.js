"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateInfo = exports.tcpPing = exports.redisPing = exports.mongodbPing = void 0;
const mongodb_1 = require("mongodb");
const redis_1 = require("redis");
const node_net_1 = require("node:net");
const node_https_1 = require("node:https");
const utils_1 = require("../utils/utils");
const mongodbPing = async (connectionString) => {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        mongodb_1.MongoClient.connect(connectionString)
            .then(async (client) => {
            await client.db().command({ ping: 1 });
            await client.close();
            resolve({
                status: "established",
                responseTime: Date.now() - startTime,
                message: "MongoDB connection established successfully",
                code: 200,
            });
        })
            .catch((error) => {
            if (error?.errorResponse) {
                reject({
                    status: "refused",
                    responseTime: Date.now() - startTime,
                    message: "MongoDB connection refused",
                    code: error?.errorResponse?.code ?? 500,
                });
            }
            else {
                reject({
                    status: "refused",
                    responseTime: Date.now() - startTime,
                    message: "MongoDB connection refused",
                    code: 500,
                });
            }
        });
    });
};
exports.mongodbPing = mongodbPing;
const redisPing = (connectionString) => {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const client = (0, redis_1.createClient)({
            url: connectionString,
        });
        client.on("error", (error) => {
            if (client.isOpen) {
                client.disconnect();
            }
            reject({
                status: "refused",
                responseTime: Date.now() - startTime,
                message: error.message ?? "Redis connection refused",
                code: 500,
            });
        });
        client.connect().then(() => {
            if (!client.isOpen) {
                reject({
                    status: "refused",
                    responseTime: Date.now() - startTime,
                    message: "Connection isn't open",
                    code: 500,
                });
            }
            client
                .ping()
                .then(() => {
                if (client.isOpen) {
                    client.disconnect();
                }
                resolve({
                    status: "established",
                    responseTime: Date.now() - startTime,
                    message: "Redis server running",
                    code: 200,
                });
            })
                .catch((err) => {
                reject({
                    status: "refused",
                    responseTime: Date.now() - startTime,
                    message: err.message ?? "Redis server down",
                    code: 500,
                });
            });
        });
    });
};
exports.redisPing = redisPing;
const tcpPing = async (hostname, port, timeout) => {
    return new Promise((resolve, reject) => {
        const socket = new node_net_1.Socket();
        const startTime = Date.now();
        const options = {
            address: hostname || "127.0.0.1",
            port: port || 80,
            timeout: timeout || 1000,
        };
        socket.setTimeout(options.timeout, () => {
            socket.destroy();
            reject({
                status: "refused",
                responseTime: Date.now() - startTime,
                message: "TCP socket timed out",
                code: 500,
            });
        });
        socket.connect(options.port, options.address, () => {
            socket.destroy();
            resolve({
                status: "established",
                responseTime: Date.now() - startTime,
                message: "Host is up and running",
                code: 200,
            });
        });
        socket.on("error", (error) => {
            socket.destroy();
            reject({
                status: "refused",
                responseTime: Date.now() - startTime,
                message: error && error.message.length > 0
                    ? error.message
                    : "TCP connection failed",
                code: 500,
            });
        });
    });
};
exports.tcpPing = tcpPing;
const getCertificateInfo = async (url) => {
    return new Promise((resolve, reject) => {
        if (!url?.startsWith("https://")) {
            reject(new Error(`Host ${url} is invalid`));
        }
        else {
            const list = url.split("//");
            const host = list[1];
            const options = {
                agent: new node_https_1.Agent({
                    maxCachedSessions: 0,
                    rejectUnauthorized: false,
                }),
                method: "GET",
                port: 443,
                path: "/",
            };
            const req = (0, node_https_1.request)({ host, ...options }, (res) => {
                const authorized = res.socket.authorized;
                const authorizationError = res.socket
                    .authorizationError;
                const cert = res.socket.getPeerCertificate();
                const validFor = cert.subjectaltname
                    ?.replace(/DNS:|IP Address:/g, "")
                    .split(", ");
                const validTo = new Date(cert.valid_to);
                const daysRemaining = (0, utils_1.getDaysRemaining)(new Date(), validTo);
                const parsed = {
                    host,
                    type: authorized ? "success" : "error",
                    reason: authorizationError,
                    validFor: validFor,
                    subject: {
                        org: cert.subject.O,
                        common_name: cert.subject.CN,
                        sans: cert.subjectaltname,
                    },
                    issuer: {
                        org: cert.issuer.O,
                        common_name: cert.issuer.CN,
                        country: cert.issuer.C,
                    },
                    info: {
                        validFrom: cert.valid_from,
                        validTo: cert.valid_to,
                        daysLeft: `${daysRemaining}`,
                        backgroundClass: "",
                    },
                };
                if (authorized) {
                    if (daysRemaining <= 30) {
                        parsed.type = "danger";
                        parsed.info.backgroundClass = "danger";
                    }
                    else if (daysRemaining > 30 && daysRemaining <= 59) {
                        parsed.type = "expiring soon";
                        parsed.info.backgroundClass = "warning";
                    }
                    else {
                        parsed.info.backgroundClass = "success";
                    }
                }
                else {
                    parsed.info.backgroundClass = "danger";
                }
                if (authorized) {
                    resolve(parsed);
                }
                else {
                    reject(parsed);
                }
            });
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Request timeout"));
            });
            req.setTimeout(5000);
            req.end();
        }
    });
};
exports.getCertificateInfo = getCertificateInfo;
//# sourceMappingURL=monitors.js.map