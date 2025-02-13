import { buildSchema } from "graphql";

export const notificationSchema = buildSchema(`#graphql
 
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
