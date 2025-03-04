"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationSchema = void 0;
const graphql_1 = require("graphql");
exports.notificationSchema = (0, graphql_1.buildSchema)(`#graphql
 
  input Notification{
    userId: Int!
    groupName: String!
    emails: String!

  }

  type NotificationResult{
    id: ID!
    userId: Int!
    groupName: String!
    emails: String!

  }

  type NotificationResponse{
    notifications: [NotificationResult!]
  }

  type DeleteNotificationResponse{
    id: ID!
  }

  type Query{
    getUserNotificationGroupsByUserId(userId:String!):NotificationResponse!
  }

  type Mutation{
    createNotificationGroup(group:Notification!):NotificationResponse!
    updateNotificationGroup(NotificationId:ID!,group:Notification!):NotificationResponse!
    deleteNotificationGroup(NotificationId:ID!):DeleteNotificationResponse!
  }
  
  
`);
//# sourceMappingURL=notification.scheme.js.map