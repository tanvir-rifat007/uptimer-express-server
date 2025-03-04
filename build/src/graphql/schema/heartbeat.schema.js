"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.heartbeatSchema = void 0;
const graphql_1 = require("graphql");
exports.heartbeatSchema = (0, graphql_1.buildSchema)(`#graphql
  type HeartBeat {
    id: ID
    monitorId: Int
    status: Int
    code: Int
    message: String
    timestamp: String
    reqHeaders: String
    resHeaders: String
    reqBody: String
    resBody: String
    responseTime: Int
    connection: String
  }

  type HeartBeatResult {
    heartbeats: [HeartBeat!]!
  }

  type Query {
    getHeartbeats(type: String!, monitorId: String!, duration: String!): HeartBeatResult
  }
`);
//# sourceMappingURL=heartbeat.schema.js.map