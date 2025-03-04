"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLModel = void 0;
const db_1 = require("../server/db");
const sequelize_1 = require("sequelize");
const SSLModel = db_1.sequelize.define("ssl_monitors", {
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
    status: {
        type: sequelize_1.DataTypes.SMALLINT,
        allowNull: false,
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    info: {
        type: sequelize_1.DataTypes.TEXT,
    },
}, {
    indexes: [
        {
            unique: false,
            fields: ["userId"],
        },
    ],
});
exports.SSLModel = SSLModel;
//# sourceMappingURL=ssl.model.js.map