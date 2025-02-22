import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { IMonitorDocument } from "@src/interfaces/monitor.interface";
import { HttpModel } from "@src/models/http.model";
import { httpMonitor } from "@src/monitors/http.monitor";
import { startSingleJob } from "@src/utils/jobs";
import { appTimeZone } from "@src/utils/utils";
import dayjs from "dayjs";
import { Model, Op } from "sequelize";

export const createHttpHeartBeat = async (data: IHeartbeat) => {
  try {
    const result: Model = await HttpModel.create(data);
    return result.dataValues;
  } catch (err) {
    throw new Error(err);
  }
};

export const getHttpHeartBeatsByDuration = async (
  monitorId: number,
  duration = 24
): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = dayjs.utc().toDate();
    dateTime.setHours(dateTime.getHours() - duration);

    const heartBeats: IHeartbeat[] = (await HttpModel.findAll({
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

    return heartBeats;
  } catch (err) {
    throw new Error(err);
  }
};

export const httpStatusMonitor = (
  monitor: IMonitorDocument,
  name: string
): void => {
  const httpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    httpAuthMethod: monitor.httpAuthMethod,
    basicAuthUser: monitor.basicAuthUser,
    basicAuthPass: monitor.basicAuthPass,
    url: monitor.url,
    method: monitor.method,
    headers: monitor.headers,
    body: monitor.body,
    timeout: monitor.timeout,
    redirects: monitor.redirects,
    bearerToken: monitor.bearerToken,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    httpMonitor.start(httpMonitorData)
  );
};
