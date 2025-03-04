"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const db_1 = require("../server/db");
const sequelize_1 = require("sequelize");
const user_model_1 = require("./user.model");
exports.NotificationModel = db_1.sequelize.define("notifications", {
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.UserModel,
            key: "id",
        },
    },
    groupName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    emails: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: Date.now(),
    },
}, {
    indexes: [
        {
            fields: ["userId"],
        },
    ],
});
//# sourceMappingURL=notification.model.js.map