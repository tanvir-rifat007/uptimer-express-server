import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from "@src/interfaces/monitor.interface";
import logger from "@src/server/logger";
import {
  createMonitor,
  deleteSingleMonitor,
  getHeartbeats,
  getMonitorById,
  getUserActiveMonitors,
  getUserMonitors,
  startCreatedMonitors,
  toggleMonitor,
  updateSingleMonitor,
} from "@src/services/monitor.service";
import { getSingleNotificationGroup } from "@src/services/notification.service";
import { startSingleJob, stopSingleBackgroundJob } from "@src/utils/jobs";
import {
  appTimeZone,
  authenticateGraphQLRoute,
  resumeMonitors,
  uptimePercentage,
} from "@src/utils/utils";
import { some, toLower } from "lodash";
import { PubSub } from "graphql-subscriptions";
import { IHeartbeat } from "@src/interfaces/heartbeat.interface";

export const pubSub: PubSub = new PubSub();

export const monitorResolver = {
  Query: {
    async getSingleMonitor(
      _parent: undefined,
      { monitorId }: { monitorId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitor: IMonitorDocument = await getMonitorById(+monitorId);
      return {
        monitors: [monitor],
      };
    },

    async getUserMonitors(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const monitors: IMonitorDocument[] = await getUserMonitors(+userId);
      return {
        monitors,
      };
    },

    async autoRefresh(
      _parent: undefined,
      { userId, refresh }: { userId: string; refresh: boolean },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (refresh) {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: true,
        };

        startSingleJob(
          `${toLower(req.currentUser?.username!)}`,
          appTimeZone,
          10,
          async () => {
            const monitors: IMonitorDocument[] =
              await getUserActiveMonitors(+userId);

            pubSub.publish("MONITORS_UPDATED", {
              monitorsUpdated: {
                userId: +userId,
                monitors,
              },
            });
          }
        );
      } else {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: false,
        };
        stopSingleBackgroundJob(`${toLower(req.currentUser?.username!)}`);
      }

      return {
        refresh,
      };
    },
  },

  Mutation: {
    async createMonitor(
      _parent: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const body: IMonitorDocument = args.monitor!;
      const monitor: IMonitorDocument = await createMonitor(body);

      if (monitor?.active && body?.active) {
        startCreatedMonitors(monitor, toLower(body.name), body.type);
      }

      return {
        userId: monitor.userId,
        monitors: [monitor],
      };
    },

    async toggleMonitor(
      _parent: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, name, active } = args.monitor!;

      const monitor = await toggleMonitor(monitorId!, userId, active);
      const hasActiveMonitors: boolean = some(
        monitor,
        (m: IMonitorDocument) => m.active
      );

      if (!hasActiveMonitors) {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: false,
        };
        stopSingleBackgroundJob(`${toLower(req.currentUser?.username!)}`);
      }

      if (!active) {
        logger.info(`Monitor ${name} is inactive`);
        stopSingleBackgroundJob(name, monitorId);
      } else {
        resumeMonitors(monitorId!);
      }

      return {
        monitors: monitor,
      };
    },

    async updateMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, monitor } = args;
      const monitors: IMonitorDocument[] = await updateSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        monitor!
      );
      return {
        monitors,
      };
    },

    async deleteMonitor(
      _parent: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, type } = args;

      await deleteSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        type!
      );
      return {
        id: monitorId,
      };
    },
  },

  MonitorResult: {
    lastChanged: (monitor: IMonitorDocument) =>
      JSON.stringify(monitor.lastChanged),
    responseTime: (monitor: IMonitorDocument) => {
      return monitor.responseTime
        ? parseInt(`${monitor.responseTime}`)
        : monitor.responseTime;
    },
    notifications: (monitor: IMonitorDocument) => {
      return getSingleNotificationGroup(monitor.notificationId!);
    },
    heartbeats: async (monitor: IMonitorDocument) => {
      const heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);

      return heartbeats.slice(0, 16);
    },
    uptime: async (monitor: IMonitorDocument): Promise<number> => {
      const heartbeats: IHeartbeat[] = await getHeartbeats(
        monitor.type,
        monitor.id!,
        24
      );
      return uptimePercentage(heartbeats);
    },
  },

  Subscription: {
    monitorsUpdated: {
      subscribe: () => pubSub.asyncIterator(["MONITORS_UPDATED"]),
    },
  },
};
