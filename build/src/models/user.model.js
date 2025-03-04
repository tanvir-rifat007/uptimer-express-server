"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = require("bcryptjs");
const db_1 = require("../server/db");
const SALT_ROUND = 10;
const UserModel = db_1.sequelize.define("users", {
    username: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    googleId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    facebookId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: Date.now,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ["email"],
        },
        {
            unique: true,
            fields: ["username"],
        },
    ],
});
exports.UserModel = UserModel;
UserModel.addHook("beforeCreate", async (auth) => {
    if (auth.dataValues.password !== undefined) {
        let { dataValues } = auth;
        const hashedPassword = await (0, bcryptjs_1.hash)(dataValues.password, SALT_ROUND);
        dataValues = { ...dataValues, password: hashedPassword };
        auth.dataValues = dataValues;
    }
});
UserModel.prototype.comparePassword = async function (password, hashedPassword) {
    return (0, bcryptjs_1.compare)(password, hashedPassword);
};
UserModel.prototype.hashPassword = async function (password) {
    return (0, bcryptjs_1.hash)(password, SALT_ROUND);
};
//# sourceMappingURL=user.model.js.map