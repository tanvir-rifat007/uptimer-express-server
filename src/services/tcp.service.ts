import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { IMonitorDocument } from "@src/interfaces/monitor.interface";
import { TcpModel } from "@src/models/tcp.model";
import { tcpMonitor } from "@src/monitors/tcp.monitor";
import { startSingleJob } from "@src/utils/jobs";
import { appTimeZone } from "@src/utils/utils";
import dayjs from "dayjs";
import { Model, Op } from "sequelize";

export const createTcpHeartBeat = async (
  data: IHeartbeat
): Promise<IHeartbeat> => {
  try {
    const result: Model = await TcpModel.create(data);
    return result.dataValues;
  } catch (error) {
    throw new Error(error);
  }
};

export const getTcpHeartBeatsByDuration = async (
  monitorId: number,
  duration = 24
): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = dayjs.utc().toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartbeat[] = (await TcpModel.findAll({
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

export const tcpStatusMonitor = (
  monitor: IMonitorDocument,
  name: string
): void => {
  const tcpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
    port: monitor.port,
    timeout: monitor.timeout,
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    tcpMonitor.start(tcpMonitorData)
  );
};
