import express, { Express } from "express";
import MonitorServer from "./server/server";
import { connectToDB } from "./server/db";

const init = async () => {
  const app: Express = express();
  const server = new MonitorServer(app);
  await connectToDB();
  server.start();
};

init();
