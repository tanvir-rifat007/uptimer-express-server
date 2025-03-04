import { pubSub } from "@src/graphql/resolvers/monitor.resolver";
import { IMonitorDocument } from "@src/interfaces/monitor.interface";
import { IAuthPayload } from "@src/interfaces/user.interface";
import {
  getAllUserActiveMonitors,
  getMonitorById,
  getUserActiveMonitors,
  startCreatedMonitors,
} from "@src/services/monitor.service";
import { Request } from "express";
import { GraphQLError } from "graphql";
import { verify } from "jsonwebtoken";
import { toLower } from "lodash";
import { startSingleJob } from "./jobs";
import { CLIENT_URL, JWT_TOKEN } from "@src/server/config";
import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { sendEmail } from "./email";
import { IEmailLocals } from "@src/interfaces/notification.interface";
import {
  getAllUsersActiveSSLMonitors,
  getSSLMonitorById,
  sslStatusMonitor,
} from "@src/services/ssl.service";
import { ISSLMonitorDocument } from "@src/interfaces/ssl.interface";

// get a user's current time zone:
export const appTimeZone: string =
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const isEmail = (email: string): boolean => {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
  return regexExp.test(email);
};

export const encodeBase64 = (user: string, pass: string): string => {
  return Buffer.from(`${user}:${pass}`).toString("base64");
};

export const authenticateGraphQLRoute = async (req: Request) => {
  const token = req.session?.jwt;
  if (!token) {
    throw new GraphQLError("You are not authenticated");
  }

  try {
    const decoded: IAuthPayload = verify(
      token,
      process.env.JWT_TOKEN!
    ) as IAuthPayload;
    req.currentUser = decoded;
  } catch (err) {
    throw new GraphQLError("You are not authenticated");
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getRandomInt = (max: number, min: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const uptimePercentage = (heartbeats: IHeartbeat[]): number => {
  if (!heartbeats) {
    return 0;
  }
  const totalHeartbeats: number = heartbeats.length;
  const downtimeHeartbeats: number = heartbeats.filter(
    (heartbeat: IHeartbeat) => heartbeat.status === 1
  ).length;
  return (
    Math.round(
      ((totalHeartbeats - downtimeHeartbeats) / totalHeartbeats) * 100
    ) || 0
  );
};

export const startMonitors = async (): Promise<void> => {
  const list: IMonitorDocument[] = await getAllUserActiveMonitors();

  for (const monitor of list) {
    // start monitor
    startCreatedMonitors(monitor, toLower(monitor.name), monitor.type);

    // sleep
    await sleep(getRandomInt(300, 1000));
  }
};

export const startSSLMonitors = async (): Promise<void> => {
  const list: ISSLMonitorDocument[] = await getAllUsersActiveSSLMonitors();

  for (const monitor of list) {
    sslStatusMonitor(monitor, toLower(monitor.name));
    await sleep(getRandomInt(300, 1000));
  }
};

export const resumeMonitors = async (monitorId: number): Promise<void> => {
  const monitor: IMonitorDocument = await getMonitorById(monitorId);
  startCreatedMonitors(monitor, toLower(monitor.name), monitor.type);
  await sleep(getRandomInt(300, 1000));
};

export const resumeSSLMonitors = async (monitorId: number): Promise<void> => {
  const monitor: ISSLMonitorDocument = await getSSLMonitorById(monitorId);
  sslStatusMonitor(monitor, toLower(monitor.name));
  await sleep(getRandomInt(300, 1000));
};

export const getDaysBetween = (start: Date, end: Date): number => {
  return Math.round(Math.abs(+start - +end) / (1000 * 60 * 60 * 24));
};

export const getDaysRemaining = (start: Date, end: Date): number => {
  const daysRemaining = getDaysBetween(start, end);
  if (new Date(end).getTime() < new Date().getTime()) {
    return -daysRemaining;
  }
  return daysRemaining;
};

export const enableAutoRefreshJob = (cookies: string): void => {
  const result: Record<string, string> = getCookies(cookies);
  const session: string = Buffer.from(result.session, "base64").toString();
  const payload: IAuthPayload = verify(
    JSON.parse(session).jwt,
    JWT_TOKEN
  ) as IAuthPayload;
  const enableAutoRefresh: boolean = JSON.parse(session).enableAutomaticRefresh;
  console.log("enabledAutoRefresh", enableAutoRefresh);
  if (enableAutoRefresh) {
    startSingleJob(
      `${toLower(payload.username)}`,
      appTimeZone,
      10,
      async () => {
        const monitors: IMonitorDocument[] = await getUserActiveMonitors(
          payload.id
        );
        pubSub.publish("MONITORS_UPDATED", {
          monitorsUpdated: {
            userId: payload.id,
            monitors,
          },
        });
      }
    );
  }
};
const getCookies = (cookie: string): Record<string, string> => {
  const cookies: Record<string, string> = {};

  cookie.split(";").forEach((cookieData) => {
    const parts: RegExpMatchArray | null = cookieData.match(/(.*?)=(.*)$/);
    cookies[parts![1].trim()] = (parts![2] || "").trim();
  });
  return cookies;
};

export const emailSender = async (
  notificationEmails: string,
  template: string,
  locals: IEmailLocals
): Promise<void> => {
  const emails = JSON.parse(notificationEmails);
  for (const email of emails) {
    await sendEmail(template, email, locals);
  }
};

export const locals = (): IEmailLocals => {
  return {
    appLink: `${CLIENT_URL}`,
    appIcon: "https://ibb.com/jD45fqX",
    appName: "",
  };
};
