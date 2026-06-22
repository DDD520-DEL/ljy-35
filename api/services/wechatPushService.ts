import type {
  WechatTemplateConfig,
  WechatTemplateData,
  PushRecord,
  Reminder,
  Route,
  Vehicle,
  Station,
} from "@shared/types";
import { dataStore } from "../store/dataStore.js";

const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY_MS = [10000, 30000, 60000];

export class WechatPushService {
  private config: WechatTemplateConfig;
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number = 0;
  private retryTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config?: Partial<WechatTemplateConfig>) {
    this.config = {
      appId: process.env.WECHAT_APP_ID || config?.appId || "mock_app_id",
      appSecret: process.env.WECHAT_APP_SECRET || config?.appSecret || "mock_app_secret",
      templateId: process.env.WECHAT_TEMPLATE_ID || config?.templateId || "mock_template_id",
    };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startRetryLoop();
    console.log("[WechatPushService] Service started");
  }

  stop(): void {
    this.isRunning = false;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    console.log("[WechatPushService] Service stopped");
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    if (this.config.appId === "mock_app_id") {
      this.accessToken = "mock_access_token";
      this.accessTokenExpiresAt = now + 7200 * 1000;
      return this.accessToken;
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.accessTokenExpiresAt = now + (data.expires_in || 7200) * 1000 - 300 * 1000;
        return this.accessToken;
      }
      throw new Error(data.errmsg || "Failed to get access token");
    } catch (err) {
      console.error("[WechatPushService] Failed to get access token:", err);
      throw err;
    }
  }

  buildTemplateData(
    vehicle: Vehicle,
    route: Route,
    station: Station,
    etaMinutes: number
  ): WechatTemplateData {
    return {
      first: {
        value: "班车即将到站，请您做好准备",
        color: "#173177",
      },
      keyword1: {
        value: route.name,
        color: "#173177",
      },
      keyword2: {
        value: vehicle.plateNumber,
        color: "#173177",
      },
      keyword3: {
        value: station.name,
        color: "#173177",
      },
      keyword4: {
        value: `${etaMinutes} 分钟`,
        color: "#FF5722",
      },
      remark: {
        value: `当前拥挤度：${this.getCrowdText(vehicle.crowdLevel)}，请您注意安全，有序乘车。`,
        color: "#888888",
      },
    };
  }

  async triggerReminderPush(reminder: Reminder): Promise<PushRecord> {
    const dedupeKey = dataStore.buildDedupeKey(
      reminder.id,
      reminder.vehicleId,
      reminder.stationId
    );
    if (dataStore.hasDedupeKey(dedupeKey)) {
      console.log(`[WechatPushService] Duplicate push detected: ${dedupeKey}`);
      const existing = dataStore.getPushRecordsByReminder(reminder.id)[0];
      if (existing) return existing;
    }
    dataStore.addDedupeKey(dedupeKey);

    const route = dataStore.getRouteById(reminder.routeId);
    const vehicle = dataStore.getVehicleById(reminder.vehicleId);
    const station = route?.stations.find((s) => s.id === reminder.stationId);
    const user = dataStore.getUserById(reminder.userId);

    if (!route || !vehicle || !station) {
      const errorMsg = "Missing route/vehicle/station data for reminder";
      console.error(`[WechatPushService] ${errorMsg}`, { reminderId: reminder.id });
      return this.createFailedRecord(reminder, errorMsg);
    }

    if (!user?.openid && this.config.appId !== "mock_app_id") {
      const errorMsg = "User has no WeChat openid";
      console.error(`[WechatPushService] ${errorMsg}`, { userId: reminder.userId });
      return this.createFailedRecord(reminder, errorMsg);
    }

    const progressPerStation = 1 / Math.max(1, route.stations.length - 1);
    const currentFloatStation = vehicle.progress / progressPerStation;
    const targetStationIdx = route.stations.findIndex((s) => s.id === reminder.stationId);
    const remaining = Math.max(0, targetStationIdx - currentFloatStation);
    const etaMinutes = Math.max(0, Math.round(remaining * 3));

    const templateData = this.buildTemplateData(vehicle, route, station, etaMinutes);

    const pushRecord = dataStore.createPushRecord({
      reminderId: reminder.id,
      userId: reminder.userId,
      channel: "wechat_template",
      maxRetries: DEFAULT_MAX_RETRIES,
      payload: JSON.stringify({
        templateId: this.config.templateId,
        openid: user?.openid || "MOCK_OPENID",
        data: templateData,
        url: process.env.WECHAT_REDIRECT_URL || undefined,
      }),
    });

    dataStore.updateReminder(reminder.id, { pushStatus: "sending" });

    const sent = await this.sendTemplateMessage(pushRecord);

    return sent;
  }

  private async sendTemplateMessage(record: PushRecord): Promise<PushRecord> {
    const payload = JSON.parse(record.payload);

    if (this.config.appId === "mock_app_id") {
      return this.handleMockSend(record, payload);
    }

    try {
      dataStore.updatePushRecord(record.id, { status: "sending" });

      const token = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;

      const body = {
        touser: payload.openid,
        template_id: payload.templateId,
        url: payload.url,
        data: payload.data,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.errcode === 0) {
        return this.handleSuccess(record);
      } else {
        return this.handleFailure(record, `WeChat API error: ${result.errmsg} (code: ${result.errcode})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.handleFailure(record, `Network error: ${msg}`);
    }
  }

  private handleMockSend(record: PushRecord, _payload: unknown): PushRecord {
    void _payload;
    const successRate = 0.85;
    const shouldSucceed = Math.random() < successRate;

    console.log(
      `[WechatPushService] [MOCK] Sending template message to user ${record.userId} (record: ${record.id})`
    );

    if (shouldSucceed) {
      return this.handleSuccess(record);
    } else {
      return this.handleFailure(record, "Mock: simulated network failure");
    }
  }

  private handleSuccess(record: PushRecord): PushRecord {
    const updated = dataStore.updatePushRecord(record.id, {
      status: "success",
      sentAt: Date.now(),
    });
    dataStore.updateReminder(record.reminderId, {
      pushStatus: "success",
    });
    dataStore.markReminderNotified(record.reminderId);
    console.log(
      `[WechatPushService] Push succeeded for reminder ${record.reminderId} (record: ${record.id})`
    );
    return updated!;
  }

  private handleFailure(record: PushRecord, error: string): PushRecord {
    const newRetryCount = record.retryCount + 1;
    const shouldRetry = newRetryCount < record.maxRetries;

    const nextDelay = shouldRetry ? RETRY_DELAY_MS[Math.min(newRetryCount - 1, RETRY_DELAY_MS.length - 1)] : 0;
    const nextRetryAt = shouldRetry ? Date.now() + nextDelay : undefined;

    const updated = dataStore.updatePushRecord(record.id, {
      status: shouldRetry ? "failed" : "failed",
      retryCount: newRetryCount,
      lastError: error,
      nextRetryAt,
    });

    if (!shouldRetry) {
      dataStore.updateReminder(record.reminderId, {
        pushStatus: "failed",
      });
    }

    console.warn(
      `[WechatPushService] Push failed for reminder ${record.reminderId} (record: ${record.id}), retry ${newRetryCount}/${record.maxRetries}: ${error}`
    );

    return updated!;
  }

  private createFailedRecord(reminder: Reminder, error: string): PushRecord {
    const record = dataStore.createPushRecord({
      reminderId: reminder.id,
      userId: reminder.userId,
      channel: "wechat_template",
      status: "failed",
      retryCount: 0,
      maxRetries: 0,
      lastError: error,
      payload: JSON.stringify({ error }),
    });
    dataStore.updateReminder(reminder.id, {
      pushStatus: "failed",
      notified: true,
    });
    return record;
  }

  private startRetryLoop(): void {
    const tick = async () => {
      if (!this.isRunning) return;

      try {
        const pending = dataStore.getPendingPushRecords();
        for (const record of pending) {
          try {
            await this.sendTemplateMessage(record);
          } catch (err) {
            console.error(
              `[WechatPushService] Retry loop error for record ${record.id}:`,
              err
            );
          }
        }

        dataStore.cleanExpiredDedupeKeys();
      } catch (err) {
        console.error("[WechatPushService] Retry loop tick error:", err);
      }

      this.retryTimer = setTimeout(tick, 5000);
    };

    this.retryTimer = setTimeout(tick, 5000);
  }

  private getCrowdText(level: string): string {
    switch (level) {
      case "loose":
        return "宽松";
      case "normal":
        return "适中";
      case "crowded":
        return "拥挤";
      default:
        return "未知";
    }
  }
}

export const wechatPushService = new WechatPushService();
