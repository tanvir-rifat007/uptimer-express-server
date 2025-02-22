import { IHeartbeat } from "@src/interfaces/heartbeat.interface";
import { IMonitorDocument } from "@src/interfaces/monitor.interface";
import logger from "@src/server/logger";
import { createHttpHeartBeat } from "@src/services/http.service";
import {
  getMonitorById,
  updateMonitorStatus,
} from "@src/services/monitor.service";
import { encodeBase64 } from "@src/utils/utils";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import dayjs from "dayjs";

class HttpMonitor {
  errorCount: number;
  noSuccessAlert: boolean;

  constructor() {
    this.errorCount = 0;
    this.noSuccessAlert = true;
  }

  async start(data: IMonitorDocument): Promise<void> {
    const {
      monitorId,
      httpAuthMethod,
      basicAuthUser,
      basicAuthPass,
      url,
      method,
      headers,
      body,
      timeout,
      redirects,
      bearerToken,
    } = data;
    const reqTimeout = timeout! * 1000;
    const startTime: number = Date.now();
    try {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      let basicAuthHeader = {};
      if (httpAuthMethod === "basic") {
        basicAuthHeader = {
          Authorization: `Basic ${encodeBase64(basicAuthUser!, basicAuthPass!)}`,
        };
      }
      if (httpAuthMethod === "token") {
        basicAuthHeader = {
          Authorization: `Bearer ${bearerToken}`,
        };
      }

      let bodyValue = null;
      let reqContentType = null;
      if (body && body!.length > 0) {
        try {
          bodyValue = JSON.parse(body!);
          reqContentType = "application/json";
        } catch (error) {
          throw new Error("Your JOSN body is invalid");
        }
      }

      const options: AxiosRequestConfig = {
        url,
        method: (method || "get").toLowerCase(),
        timeout: reqTimeout,
        headers: {
          Accept: "text/html,application/json",
          ...(reqContentType ? { "Content-Type": reqContentType } : {}),
          ...basicAuthHeader,
          ...(headers ? JSON.parse(headers) : {}),
        },
        maxRedirects: redirects,
        ...(bodyValue && {
          data: bodyValue,
        }),
      };
      const response: AxiosResponse = await axios.request(options);
      const responseTime = Date.now() - startTime;
      let heartbeatData: IHeartbeat = {
        monitorId: monitorId!,
        status: 0,
        code: response.status ?? 0,
        message: `${response.status} - ${response.statusText}`,
        timestamp: dayjs.utc().valueOf(),
        reqHeaders: JSON.stringify(response.headers) ?? "",
        resHeaders: JSON.stringify(response.request.res.rawHeaders) ?? "",
        reqBody: body,
        resBody: JSON.stringify(response.data) ?? "",
        responseTime,
      };
      const statusList = JSON.parse(monitorData.statusCode!);
      const responseDurationTime = JSON.parse(monitorData.responseTime!);
      const contentTypeList =
        monitorData.contentType!.length > 0
          ? JSON.parse(JSON.stringify(monitorData.contentType!))
          : [];
      console.log("statusList", statusList);
      console.log("responseDurationTime", responseDurationTime);
      console.log("responseTime", responseTime);
      console.log("contentTypeList", contentTypeList);
      if (
        !statusList.includes(response.status) ||
        responseDurationTime < responseTime ||
        (contentTypeList.length > 0 &&
          !contentTypeList.includes(response.headers["content-type"]))
      ) {
        heartbeatData = {
          ...heartbeatData,
          status: 1,
          message: "Failed http response assertion",
          code: 500,
        };
        this.errorAssertionCheck(monitorData, heartbeatData);
      } else {
        this.successAssertionCheck(monitorData, heartbeatData);
      }
    } catch (error) {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      this.httpError(monitorId!, startTime, monitorData, error);
    }
  }

  async errorAssertionCheck(
    monitorData: IMonitorDocument,
    heartbeatData: IHeartbeat
  ): Promise<void> {
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createHttpHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
    }
    logger.info(
      `HTTP heartbeat failed assertions: Monitor ID ${monitorData.id}`
    );
  }

  async successAssertionCheck(
    monitorData: IMonitorDocument,
    heartbeatData: IHeartbeat
  ): Promise<void> {
    await Promise.all([
      updateMonitorStatus(monitorData, heartbeatData.timestamp, "success"),
      createHttpHeartBeat(heartbeatData),
    ]);
    if (!this.noSuccessAlert) {
      this.errorCount = 0;
      this.noSuccessAlert = true;
    }
    logger.info(`HTTP heartbeat success: Monitor ID ${monitorData.id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async httpError(
    monitorId: number,
    startTime: number,
    monitorData: IMonitorDocument,
    error: any
  ): Promise<void> {
    logger.info(`HTTP heartbeat failed: Monitor ID ${monitorData.id}`);
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartbeat = {
      monitorId: monitorId!,
      status: 1,
      code: error.response ? error.response.status : 500,
      message: error.response
        ? `${error.response.status} - ${error.response.statusText}`
        : "Http monitor error",
      timestamp,
      reqHeaders: error.response ? JSON.stringify(error.response.headers) : "",
      resHeaders: error.response
        ? JSON.stringify(error.response.request.res.rawHeaders)
        : "",
      reqBody: "",
      resBody: error.response ? JSON.stringify(error.response.data) : "",
      responseTime: Date.now() - startTime,
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createHttpHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
    }
  }
}

export const httpMonitor: HttpMonitor = new HttpMonitor();
