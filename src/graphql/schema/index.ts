// vinno vinno file theke schema gula import kore merge korbo ei mergeTypeDefs er maddhome
import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user.scheme";
import { notificationSchema } from "./notification.scheme";
import { monitorSchema } from "./monitor.scheme";

export const mergedGQLSchema = mergeTypeDefs([
  userSchema,
  notificationSchema,
  monitorSchema,
]);
