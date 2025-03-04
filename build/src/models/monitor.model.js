"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../server/db");
const MonitorModel = db_1.sequelize.define("monitors", {
    notificationId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    status: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    frequency: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
    },
    alertThreshold: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lastChanged: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    timeout: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    uptime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    redirects: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    method: {
        type: sequelize_1.DataTypes.STRING,
    },
    headers: {
        type: sequelize_1.DataTypes.TEXT,
    },
    body: {
        type: sequelize_1.DataTypes.TEXT,
    },
    httpAuthMethod: {
        type: sequelize_1.DataTypes.TEXT,
    },
    basicAuthUser: {
        type: sequelize_1.DataTypes.TEXT,
    },
    basicAuthPass: {
        type: sequelize_1.DataTypes.TEXT,
    },
    bearerToken: {
        type: sequelize_1.DataTypes.TEXT,
    },
    contentType: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    statusCode: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    responseTime: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    connection: {
        type: sequelize_1.DataTypes.TEXT,
    },
    port: {
        type: sequelize_1.DataTypes.INTEGER,
    },
}, {
    indexes: [
        {
            unique: false,
            fields: ["userId"],
        },
    ],
});
exports.MonitorModel = MonitorModel;
//# sourceMappingURL=monitor.model.js.map