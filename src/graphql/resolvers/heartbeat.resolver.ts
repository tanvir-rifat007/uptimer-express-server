import {
  IHeartbeat,
  IHeartBeatArgs,
} from "@src/interfaces/heartbeat.interface";
import { AppContext } from "@src/interfaces/monitor.interface";
import { getHeartbeats } from "@src/services/monitor.service";
import { authenticateGraphQLRoute } from "@src/utils/utils";

export const heartbeatResolver = {
  Query: {
    async getHeartbeats(
      _parent: undefined,
      args: IHeartBeatArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { type, monitorId, duration } = args;
      const heartbeats: IHeartbeat[] = await getHeartbeats(
        type,
        +monitorId,
        +duration
      );
      return {
        heartbeats,
      };
    },
  },

  HeartBeat: {
    timestamp: (heartbeat: IHeartbeat) => JSON.stringify(heartbeat.timestamp),
  },
};
