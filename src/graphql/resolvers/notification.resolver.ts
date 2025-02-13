import { INotificationDocument } from "@src/interfaces/notification.interface";
import { AppContext } from "@src/server/server";
import {
  createNotificationGroup,
  deleteNotificationGroup,
  getAllNotificationGroupsByUserId,
  updateNotificationGroup,
} from "@src/services/notification.service";
import { authenticateGraphQLRoute } from "@src/utils/utils";

export const notificationResolver = {
  Query: {
    async getUserNotificationGroupsByUserId(
      _parent: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      // check the user is authenticated
      // using jwt token
      try {
        authenticateGraphQLRoute(req);
      } catch (err) {
        throw new Error("You are not authenticated");
      }

      const notifications = await getAllNotificationGroupsByUserId(+userId);
      return { notifications };
    },
  },

  Mutation: {
    createNotificationGroup: async (
      _parent: undefined,
      { group }: { group: INotificationDocument },
      contextValue: AppContext
    ) => {
      const { req } = contextValue;
      // check the user is authenticated
      // using jwt token
      authenticateGraphQLRoute(req);

      // create the notification group

      const notification = await createNotificationGroup(group);

      return { notifications: [notification] };
    },

    updateNotificationGroup: async (
      _parent: undefined,
      {
        NotificationId,
        group,
      }: { NotificationId: string; group: INotificationDocument },
      contextValue: AppContext
    ) => {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      // update the notification group
      await updateNotificationGroup(+NotificationId, group);
      return {
        notifications: [
          {
            ...group,
            id: NotificationId,
          },
        ],
      };
    },

    deleteNotificationGroup: async (
      _parent: undefined,
      { NotificationId }: { NotificationId: string },
      contextValue: AppContext
    ) => {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      // delete the notification group
      await deleteNotificationGroup(+NotificationId);
      return { id: NotificationId };
    },
  },
};
