import { heartbeatResolver } from "./heartbeat.resolver";
import { uptimeMonitorResolver } from "./monitor.resolver";
import { notificationResolver } from "./notification.resolver";
import { SSLMonitorResolver } from "./ssl.resolver";
import { UserResolver } from "./user.resolver";

export const resolvers = [
  UserResolver,
  notificationResolver,
  uptimeMonitorResolver,
  heartbeatResolver,
  SSLMonitorResolver,
];
