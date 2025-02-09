import express, { Express } from "express";
import MonitorServer from "./server/server";

const init = async () => {
  const app: Express = express();
  const server = new MonitorServer(app);
  server.start();
};

init();
