"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationResolver = void 0;
const notification_service_1 = require("../../services/notification.service");
const utils_1 = require("../../utils/utils");
exports.notificationResolver = {
    Query: {
        async getUserNotificationGroupsByUserId(_parent, { userId }, contextValue) {
            const { req } = contextValue;
            // check the user is authenticated
            // using jwt token
            try {
                (0, utils_1.authenticateGraphQLRoute)(req);
            }
            catch (err) {
                throw new Error("You are not authenticated");
            }
            const notifications = await (0, notification_service_1.getAllNotificationGroupsByUserId)(+userId);
            return { notifications };
        },
    },
    Mutation: {
        createNotificationGroup: async (_parent, { group }, contextValue) => {
            const { req } = contextValue;
            // check the user is authenticated
            // using jwt token
            (0, utils_1.authenticateGraphQLRoute)(req);
            // create the notification group
            const notification = await (0, notification_service_1.createNotificationGroup)(group);
            return { notifications: [notification] };
        },
        updateNotificationGroup: async (_parent, { NotificationId, group, }, contextValue) => {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            // update the notification group
            await (0, notification_service_1.updateNotificationGroup)(+NotificationId, group);
            return {
                notifications: [
                    {
                        ...group,
                        id: NotificationId,
                    },
                ],
            };
        },
        deleteNotificationGroup: async (_parent, { NotificationId }, contextValue) => {
            const { req } = contextValue;
            (0, utils_1.authenticateGraphQLRoute)(req);
            // delete the notification group
            await (0, notification_service_1.deleteNotificationGroup)(+NotificationId);
            return { id: NotificationId };
        },
    },
};
//# sourceMappingURL=notification.resolver.js.map