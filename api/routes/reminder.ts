import { Router, type Request, type Response } from "express";
import { dataStore } from "../store/dataStore.js";
import { wechatPushService } from "../services/wechatPushService.js";
import type { Reminder, PushChannel, ApiResponse } from "@shared/types";

const router = Router();

const MOCK_USER_ID = "user_demo_001";
const MOCK_OPENID = "oMockOpenId123456789";

router.post("/reminders", (req: Request, res: Response): void => {
  try {
    const { routeId, vehicleId, stationId, pushChannel, triggerThreshold, userId, openid } =
      req.body;

    if (!routeId || !vehicleId || !stationId) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: routeId, vehicleId, stationId",
      } as ApiResponse);
      return;
    }

    const actualUserId = userId || MOCK_USER_ID;
    if (openid) {
      dataStore.getOrCreateUser(actualUserId, openid);
    } else {
      dataStore.getOrCreateUser(actualUserId, MOCK_OPENID);
    }

    const reminder = dataStore.createReminder({
      routeId,
      vehicleId,
      stationId,
      userId: actualUserId,
      pushChannel: (pushChannel as PushChannel) || "wechat_template",
      triggerThreshold: triggerThreshold ?? 1,
    });

    res.json({
      success: true,
      message: "到站提醒创建成功",
      data: reminder,
    } as ApiResponse<Reminder>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to create reminder: ${msg}`,
    } as ApiResponse);
  }
});

router.get("/reminders", (req: Request, res: Response): void => {
  try {
    const { userId } = req.query;
    const actualUserId = (userId as string) || MOCK_USER_ID;
    const reminders = dataStore.getRemindersByUser(actualUserId);

    res.json({
      success: true,
      data: reminders,
    } as ApiResponse<Reminder[]>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to fetch reminders: ${msg}`,
    } as ApiResponse);
  }
});

router.get("/reminders/:id", (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const reminder = dataStore.getReminderById(id);

    if (!reminder) {
      res.status(404).json({
        success: false,
        error: "Reminder not found",
      } as ApiResponse);
      return;
    }

    const pushRecords = dataStore.getPushRecordsByReminder(id);

    res.json({
      success: true,
      data: {
        reminder,
        pushRecords,
      },
    } as ApiResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to fetch reminder: ${msg}`,
    } as ApiResponse);
  }
});

router.delete("/reminders/:id", (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const reminder = dataStore.getReminderById(id);

    if (!reminder) {
      res.status(404).json({
        success: false,
        error: "Reminder not found",
      } as ApiResponse);
      return;
    }

    dataStore.cancelReminder(id);

    res.json({
      success: true,
      message: "到站提醒已取消",
    } as ApiResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to cancel reminder: ${msg}`,
    } as ApiResponse);
  }
});

router.post("/reminders/:id/trigger", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reminder = dataStore.getReminderById(id);

    if (!reminder) {
      res.status(404).json({
        success: false,
        error: "Reminder not found",
      } as ApiResponse);
      return;
    }

    if (reminder.notified && reminder.pushStatus === "success") {
      res.status(400).json({
        success: false,
        error: "Reminder already sent successfully",
      } as ApiResponse);
      return;
    }

    const pushRecord = await wechatPushService.triggerReminderPush(reminder);

    res.json({
      success: true,
      message: "推送触发成功",
      data: pushRecord,
    } as ApiResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to trigger reminder: ${msg}`,
    } as ApiResponse);
  }
});

router.get("/push-records", (_req: Request, res: Response): void => {
  try {
    const records = dataStore.getPushRecords();
    res.json({
      success: true,
      data: records,
    } as ApiResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: `Failed to fetch push records: ${msg}`,
    } as ApiResponse);
  }
});

export default router;
