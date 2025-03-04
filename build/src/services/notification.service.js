"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationGroup = createNotificationGroup;
exports.getSingleNotificationGroup = getSingleNotificationGroup;
exports.getAllNotificationGroupsByUserId = getAllNotificationGroupsByUserId;
exports.updateNotificationGroup = updateNotificationGroup;
exports.deleteNotificationGroup = deleteNotificationGroup;
const notification_model_1 = require("../models/notification.model");
async function createNotificationGroup(data) {
    try {
        const result = await notification_model_1.NotificationModel.create(data);
        return result.dataValues;
    }
    catch (err) {
        throw new Error(err);
    }
}
async function getSingleNotificationGroup(notificationId) {
    try {
        const notifications = (await notification_model_1.NotificationModel.findOne({
            raw: true,
            where: {
                id: notificationId,
            },
            order: [["createdAt", "DESC"]],
        }));
        return notifications;
    }
    catch (error) {
        throw new Error(error);
    }
}
async function getAllNotificationGroupsByUserId(userId) {
    try {
        const notifications = (await notification_model_1.NotificationModel.findAll({
            raw: true,
            where: {
                userId,
            },
            order: [["createdAt", "DESC"]],
        }));
        return notifications;
    }
    catch (err) {
        throw new Error(err);
    }
}
async function updateNotificationGroup(notificationId, data) {
    try {
        await notification_model_1.NotificationModel.update(data, {
            where: {
                id: notificationId,
            },
        });
    }
    catch (error) {
        throw new Error(error);
    }
}
async function deleteNotificationGroup(notificationId) {
    try {
        await notification_model_1.NotificationModel.destroy({
            where: { id: notificationId },
        });
    }
    catch (error) {
        throw new Error(error);
    }
}
//# sourceMappingURL=notification.service.js.map