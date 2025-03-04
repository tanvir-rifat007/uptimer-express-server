"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpModel = void 0;
const db_1 = require("../server/db");
const sequelize_1 = require("sequelize");
const TcpModel = db_1.sequelize.define("tcp_heartbeats", {
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
    responseTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    connection: {
        type: sequelize_1.DataTypes.STRING,
    },
}, {
    indexes: [
        {
            unique: false,
            fields: ["monitorId"],
        },
    ],
});
exports.TcpModel = TcpModel;
//# sourceMappingURL=tcp.model.js.map