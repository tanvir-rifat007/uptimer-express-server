"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const schema_1 = require("@graphql-tools/schema");
const node_http_1 = __importDefault(require("node:http"));
const config_1 = require("./config");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const disabled_1 = require("@apollo/server/plugin/disabled");
const default_1 = require("@apollo/server/plugin/landingPage/default");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express4_1 = require("@apollo/server/express4");
const cookie_session_1 = __importDefault(require("cookie-session"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const logger_1 = __importDefault(require("./logger"));
const schema_2 = require("../graphql/schema");
const resolvers_1 = require("../graphql/resolvers");
const utils_1 = require("../utils/utils");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(customParseFormat_1.default);
class MonitorServer {
    app;
    httpServer;
    server;
    wsServer;
    constructor(app) {
        // this.app means the Express app that is passed to the constructor
        this.app = app;
        this.httpServer = new node_http_1.default.Server(this.app);
        this.wsServer = new ws_1.WebSocketServer({
            server: this.httpServer,
            path: "/graphql",
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: schema_2.mergedGQLSchema,
            resolvers: resolvers_1.resolvers,
        });
        // websocket server cleanup
        const wsServerCleanup = (0, ws_2.useServer)({
            schema,
        }, this.wsServer);
        this.server = new server_1.ApolloServer({
            schema,
            // enable the introspection(graphql dev mode) only in development mode
            introspection: config_1.NODE_ENV === "development",
            plugins: [
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer: this.httpServer }),
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
                config_1.NODE_ENV === "production"
                    ? (0, disabled_1.ApolloServerPluginLandingPageDisabled)()
                    : (0, default_1.ApolloServerPluginLandingPageLocalDefault)({ embed: true }),
            ],
        });
    }
    async start() {
        // we are using apollo express middleware
        // so that why we need to start the server first
        await this.server.start();
        this.standardMiddleware(this.app);
        this.webSocketConnection();
        await this.startServer();
    }
    standardMiddleware(app) {
        app.set("trust proxy", 1);
        // middleware so that graphql always return the latest data
        // and not cache the data
        app.use((_req, res, next) => {
            res.header("Cache-Control", "no-cache, no-store, must-revalidate");
            next();
        });
        // before passing the request to the express middleware graphql
        // we need to add the cookie session middleware
        app.use((0, cookie_session_1.default)({
            name: "session",
            keys: [config_1.SECRET_KEY_ONE, config_1.SECRET_KEY_TWO],
            maxAge: 24 * 7 * 3600000, // 7 days validity
            secure: config_1.NODE_ENV === "production",
            ...(config_1.NODE_ENV === "production" ? { sameSite: "none" } : {}),
        }));
        this.graphqlRoute(app);
        this.healthCheckRoute(app);
    }
    graphqlRoute(app) {
        app.use("/graphql", (0, cors_1.default)({
            origin: config_1.CLIENT_URL,
            credentials: true,
        }), express_1.default.json(), (0, express4_1.expressMiddleware)(this.server, {
            context: async ({ req, res }) => {
                return { req, res };
            },
        }));
    }
    healthCheckRoute(app) {
        const data = {
            uptime: process.uptime(),
            message: "OK",
            timestamp: Date.now(),
        };
        app.get("/health", (_req, res) => {
            res.json(data);
        });
    }
    webSocketConnection() {
        this.wsServer.on("connection", (_ws, req) => {
            if (req.headers && req.headers.cookie) {
                (0, utils_1.enableAutoRefreshJob)(req.headers.cookie);
            }
        });
    }
    async startServer() {
        try {
            // make the port string to a number
            const PORT = +process.env.PORT || 8000;
            logger_1.default.info(`Server has started with process id ${process.pid}`);
            this.httpServer.listen(PORT, () => {
                logger_1.default.info(`Server is running on port ${PORT}`);
                (0, utils_1.startMonitors)();
                (0, utils_1.startSSLMonitors)();
            });
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
}
exports.default = MonitorServer;
//# sourceMappingURL=server.js.map