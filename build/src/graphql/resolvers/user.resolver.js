"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const user_service_1 = require("../../services/user.service");
const graphql_1 = require("graphql");
const lodash_1 = require("lodash");
const jsonwebtoken_1 = require("jsonwebtoken");
const notification_service_1 = require("../../services/notification.service");
const config_1 = require("../../server/config");
const utils_1 = require("../../utils/utils");
const user_model_1 = require("../../models/user.model");
const logger_1 = __importDefault(require("../../server/logger"));
exports.UserResolver = {
    Query: {
        async checkCurrentUser(_parent, _args, contextValue) {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            logger_1.default.info(req.currentUser);
            const notifications = await (0, notification_service_1.getAllNotificationGroupsByUserId)(req.currentUser?.id);
            return {
                user: {
                    id: req.currentUser?.id,
                    username: req.currentUser?.username,
                    email: req.currentUser?.email,
                    createdAt: new Date(),
                },
                notifications,
            };
        },
    },
    Mutation: {
        async registerUser(_parent, args, contextValue) {
            const { req } = contextValue;
            const { user } = args;
            const { username, email, password } = user;
            // call the service function for the user;
            const checkIfUserExist = await (0, user_service_1.getUserByUsernameOrEmail)(username, email);
            if (checkIfUserExist) {
                throw new graphql_1.GraphQLError("User already exist");
            }
            const authData = {
                username: (0, lodash_1.upperFirst)(username),
                email: (0, lodash_1.toLower)(email),
                password,
            };
            // create the user
            const createdUser = await (0, user_service_1.createNewUser)(authData);
            return userReturnValue(req, createdUser, "register");
        },
        async loginUser(_, args, contextValue) {
            const { req } = contextValue;
            const { username, password } = args;
            const isValidEmail = (0, utils_1.isEmail)(username);
            const type = !isValidEmail ? "username" : "email";
            const existingUser = await (0, user_service_1.getUserByProp)(username, type);
            if (!existingUser) {
                throw new graphql_1.GraphQLError("Invalid credentials");
            }
            const passwordsMatch = await user_model_1.UserModel.prototype.comparePassword(password, existingUser.password);
            if (!passwordsMatch) {
                throw new graphql_1.GraphQLError("Invalid credentials");
            }
            const response = await userReturnValue(req, existingUser, "login");
            return response;
        },
        async authSocialUser(_, args, contextValue) {
            const { req } = contextValue;
            const { user } = args;
            const { username, email, socialId, type } = user;
            const checkIfUserExist = await (0, user_service_1.getUserBySocialId)(socialId, email, type);
            if (checkIfUserExist) {
                const response = await userReturnValue(req, checkIfUserExist, "login");
                return response;
            }
            else {
                const authData = {
                    username: (0, lodash_1.upperFirst)(username),
                    email: (0, lodash_1.toLower)(email),
                    ...(type === "facebook" && {
                        facebookId: socialId,
                    }),
                    ...(type === "google" && {
                        googleId: socialId,
                    }),
                };
                const result = await (0, user_service_1.createNewUser)(authData);
                const response = await userReturnValue(req, result, "register");
                return response;
            }
        },
        logout(_parent, _args, contextValue) {
            const { req } = contextValue;
            req.session = null;
            return { message: "Logout successfully" };
        },
    },
    // Here in the user.scheme.ts file, I define the user createdAt as type String
    // but in the user.interface.ts file, I define the createdAt as type Date. Because I save the createdAt as Date type in the database.
    // so that's why I need to convert the createdAt to String type in the userReturnValue function.
    User: {
        createdAt: (user) => new Date(user.createdAt).toISOString(),
    },
};
async function userReturnValue(req, result, type) {
    let notifications = [];
    if (type === "register" && result && result.id && result.email) {
        const notification = await (0, notification_service_1.createNotificationGroup)({
            userId: result.id,
            groupName: "Default Contact Group",
            emails: JSON.stringify([result.email]),
        });
        notifications.push(notification);
    }
    else if (type === "login" && result && result.id && result.email) {
        notifications = await (0, notification_service_1.getAllNotificationGroupsByUserId)(result.id);
    }
    const userJwt = (0, jsonwebtoken_1.sign)({
        id: result.id,
        email: result.email,
        username: result.username,
    }, config_1.JWT_TOKEN);
    req.session = { jwt: userJwt, enableAutomaticRefresh: false };
    const user = {
        id: result.id,
        email: result.email,
        username: result.username,
        createdAt: result.createdAt,
    };
    return {
        user,
        notifications,
    };
}
//# sourceMappingURL=user.resolver.js.map