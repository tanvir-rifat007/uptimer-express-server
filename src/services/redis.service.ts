import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { IMonitorDocument } from "@src/interfaces/monitor.interface";
import { RedisModel } from "@src/models/redis.model";
import { redisMonitor } from "@src/monitors/redis.monitor";
import { startSingleJob } from "@src/utils/jobs";
import { appTimeZone } from "@src/utils/utils";
import dayjs from "dayjs";
import { Model, Op } from "sequelize";

export const createRedisHeartBeat = async (
  data: IHeartbeat
): Promise<IHeartbeat> => {
  try {
    const result: Model = await RedisModel.create(data);
    return result.dataValues;
  } catch (error) {
    throw new Error(error);
  }
};

export const getRedisHeartBeatsByDuration = async (
  monitorId: number,
  duration = 24
): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = dayjs.utc().toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartbeat[] = (await RedisModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          { monitorId },
          {
            timestamp: {
              [Op.gte]: dateTime,
            },
          },
        ],
      },
      order: [["timestamp", "DESC"]],
    })) as unknown as IHeartbeat[];
    return heartbeats;
  } catch (error) {
    throw new Error(error);
  }
};

export const redisStatusMonitor = (
  monitor: IMonitorDocument,
  name: string
): void => {
  const redisMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    redisMonitor.start(redisMonitorData)
  );
};
