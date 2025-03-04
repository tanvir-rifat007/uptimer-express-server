"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const graphql_1 = require("graphql");
exports.userSchema = (0, graphql_1.buildSchema)(`#graphql
  input Auth {
    username: String
    email: String
    password: String
    socialId: String
    type: String
  }

  type User {
    id: Int
    username: String
    email: String
    createdAt: String
    googleId: String
    facebookId: String
  }

  type NotificationResult {
    id: ID!
    userId: Int!
    groupName: String!
    emails: String!
  }

  type AuthResponse {
    user: User!
    notifications: [NotificationResult!]!
  }

  type AuthLogoutResponse {
    message: String
  }

  type CurrentUserResponse {
    user: User
    notifications: [NotificationResult]
  }

  type Query {
    checkCurrentUser: CurrentUserResponse
  }

  type Mutation {
    loginUser(username: String!, password: String!): AuthResponse!
    registerUser(user: Auth!): AuthResponse!
    authSocialUser(user: Auth!): AuthResponse!
    logout: AuthLogoutResponse
  }
`);
//# sourceMappingURL=user.scheme.js.map