"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewUser = createNewUser;
exports.getUserByUsernameOrEmail = getUserByUsernameOrEmail;
exports.getUserBySocialId = getUserBySocialId;
exports.getUserByProp = getUserByProp;
const user_model_1 = require("../models/user.model");
const sequelize_1 = require("sequelize");
const lodash_1 = require("lodash");
async function createNewUser(data) {
    try {
        const result = await user_model_1.UserModel.create(data);
        // remove the password field from the result
        const userData = (0, lodash_1.omit)(result.dataValues, [
            "password",
        ]);
        return userData;
    }
    catch (err) {
        throw new Error(err);
    }
}
async function getUserByUsernameOrEmail(username, email) {
    try {
        const user = (await user_model_1.UserModel.findOne({
            // raw:true means that the result will be plain JSON object in the user variable
            raw: true,
            where: {
                [sequelize_1.Op.or]: [
                    { username: (0, lodash_1.upperFirst)(username) },
                    { email: (0, lodash_1.toLower)(email) },
                ],
            },
        }));
        return user;
    }
    catch (err) {
        throw new Error(err);
    }
}
async function getUserBySocialId(socialId, email, type) {
    try {
        const user = (await user_model_1.UserModel.findOne({
            raw: true,
            where: {
                [sequelize_1.Op.or]: [
                    {
                        ...(type === "facebook" && {
                            facebookId: socialId,
                        }),
                        ...(type === "google" && {
                            googleId: socialId,
                        }),
                    },
                    { email: (0, lodash_1.toLower)(email) },
                ],
            },
        }));
        return user;
    }
    catch (error) {
        throw new Error(error);
    }
}
async function getUserByProp(prop, type) {
    try {
        const user = (await user_model_1.UserModel.findOne({
            raw: true,
            where: {
                ...(type === "username" && {
                    username: (0, lodash_1.upperFirst)(prop),
                }),
                ...(type === "email" && {
                    email: (0, lodash_1.toLower)(prop),
                }),
            },
        }));
        return user;
    }
    catch (error) {
        throw new Error(error);
    }
}
//# sourceMappingURL=user.service.js.map