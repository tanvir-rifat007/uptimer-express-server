import { heartbeatResolver } from "./heartbeat.resolver";
import { monitorResolver } from "./monitor.resolver";
import { notificationResolver } from "./notification.resolver";
import { UserResolver } from "./user.resolver";

export const resolvers = [
  UserResolver,
  notificationResolver,
  monitorResolver,
  heartbeatResolver,
];
