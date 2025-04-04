import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Express, NextFunction, Request, Response } from "express";
import http from "node:http";
import { CLIENT_URL, NODE_ENV, SECRET_KEY_ONE, SECRET_KEY_TWO } from "./config";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

import cors from "cors";

import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import cookieSession from "cookie-session";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customFormat from "dayjs/plugin/customParseFormat";

import logger from "./logger";
import { mergedGQLSchema } from "@src/graphql/schema";
import { GraphQLSchema } from "graphql";
import { BaseContext } from "@apollo/server";
import { resolvers } from "@src/graphql/resolvers";
import { AppContext } from "@src/interfaces/monitor.interface";
import {
  enableAutoRefreshJob,
  startMonitors,
  startSSLMonitors,
} from "@src/utils/utils";

import { Server, WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customFormat);

export default class MonitorServer {
  private app: Express;
  private httpServer: http.Server;
  private server: ApolloServer;
  private wsServer: Server;

  constructor(app: Express) {
    // this.app means the Express app that is passed to the constructor

    this.app = app;
    this.httpServer = new http.Server(this.app);
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: "/graphql",
    });
    const schema: GraphQLSchema = makeExecutableSchema({
      typeDefs: mergedGQLSchema,
      resolvers,
    });

    // websocket server cleanup
    const wsServerCleanup = useServer(
      {
        schema,
      },
      this.wsServer
    );

    this.server = new ApolloServer<AppContext | BaseContext>({
      schema,
      // enable the introspection(graphql dev mode) only in development mode
      introspection: NODE_ENV === "development",

      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),

        // cleanup the websocket server when the server is stopped
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await wsServerCleanup.dispose();
              },
            };
          },
        },
        NODE_ENV === "production"
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    });
  }

  public async start(): Promise<void> {
    // we are using apollo express middleware
    // so that why we need to start the server first
    await this.server.start();
    this.standardMiddleware(this.app);
    this.webSocketConnection();
    await this.startServer();
  }

  private standardMiddleware(app: Express): void {
    app.set("trust proxy", 1);

    // middleware so that graphql always return the latest data
    // and not cache the data
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });
    // before passing the request to the express middleware graphql
    // we need to add the cookie session middleware
    app.use(
      cookieSession({
        name: "session",
        keys: [SECRET_KEY_ONE, SECRET_KEY_TWO],
        maxAge: 24 * 7 * 3600000, // 7 days validity
        secure: NODE_ENV === "production",
        ...(NODE_ENV === "production" ? { sameSite: "none" } : {}),
      })
    );

    this.graphqlRoute(app);
    this.healthCheckRoute(app);
  }

  private graphqlRoute(app: Express): void {
    app.use(
      "/graphql",
      cors({
        origin: CLIENT_URL,
        credentials: true,
      }),
      express.json(),
      expressMiddleware(this.server, {
        context: async ({ req, res }: { req: Request; res: Response }) => {
          return { req, res };
        },
      })
    );
  }

  private healthCheckRoute(app: Express): void {
    const data = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
    };
    app.get("/health", (_req: Request, res: Response) => {
      res.json(data);
    });
  }

  private webSocketConnection(): void {
    this.wsServer.on(
      "connection",
      (_ws: WebSocket, req: http.IncomingMessage) => {
        if (req.headers && req.headers.cookie) {
          enableAutoRefreshJob(req.headers.cookie!);
        }
      }
    );
  }

  private async startServer(): Promise<void> {
    try {
      // make the port string to a number
      const PORT = +process.env.PORT! || 8000;
      logger.info(`Server has started with process id ${process.pid}`);

      this.httpServer.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        startMonitors();
        startSSLMonitors();
      });
    } catch (err) {
      logger.error(err);
    }
  }
}
