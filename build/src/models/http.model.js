"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModel = void 0;
const db_1 = require("../server/db");
const sequelize_1 = require("sequelize");
const HttpModel = db_1.sequelize.define("http_heartbeats", {
    monitorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    message: {
        type: sequelize_1.DataTypes.STRING,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    reqHeaders: {
        type: sequelize_1.DataTypes.TEXT,
    },
    resHeaders: {
        type: sequelize_1.DataTypes.TEXT,
    },
    reqBody: {
        type: sequelize_1.DataTypes.TEXT,
    },
    resBody: {
        type: sequelize_1.DataTypes.TEXT,
    },
    responseTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    indexes: [
        {
            unique: false,
            fields: ["monitorId"],
        },
    ],
});
exports.HttpModel = HttpModel;
//# sourceMappingURL=http.model.js.map