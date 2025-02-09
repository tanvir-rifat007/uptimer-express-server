import { Express, NextFunction, Request, Response } from "express";
import http from "node:http";

export default class MonitorServer {
  private app: Express;
  private httpServer: http.Server;

  constructor(app: Express) {
    // this.app means the Express app that is passed to the constructor

    this.app = app;
    this.httpServer = new http.Server(this.app);
  }

  public async start(): Promise<void> {
    this.standardMiddleware(this.app);
    await this.startServer();
  }

  private standardMiddleware(app: Express): void {
    app.set("trust proxy", 1);
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });
  }

  private async startServer(): Promise<void> {
    try {
      // make the port string to a number
      const PORT = +process.env.PORT! || 8000;
      console.info(`Server has started with process id ${process.pid}`);

      this.httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (err) {
      console.error(err);
    }
  }
}
