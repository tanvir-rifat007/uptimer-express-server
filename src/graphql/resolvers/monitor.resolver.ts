import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from "@src/interfaces/monitor.interface";
import logger from "@src/server/logger";
import {
  createMonitor,
  deleteSingleMonitor,
  getMonitorById,
  getUserMonitors,
  toggleMonitor,
  updateSingleMonitor,
} from "@src/services/monitor.service";
import { getSingleNotificationGroup } from "@src/services/notification.service";
import { startSingleJob, stopSingleBackgroundJob } from "@src/utils/jobs";
import { appTimeZone, authenticateGraphQLRoute } from "@src/utils/utils";

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
        logger.info(`Monitor ${monitor.name} is active`);
        startSingleJob(monitor.name, appTimeZone, 10, () =>
          logger.info("This is called every 10 seconds")
        );
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

      if (!active) {
        logger.info(`Monitor ${name} is inactive`);
        stopSingleBackgroundJob(name, monitorId);
      } else {
        logger.info(`Monitor ${name} is active`);
        startSingleJob(name, appTimeZone, 10, () =>
          logger.info("This is called every 10 seconds")
        );
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
  },
};
