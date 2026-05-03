import { Router } from "express";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId, unreadOnly } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (mobile) filter["mobile"] = mobile;
    if (farmerId) filter["farmerId"] = farmerId;
    if (unreadOnly === "true") filter["read"] = false;

    const notifications = await db
      .collection("notifications")
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json(notifications);
  } catch (err) {
    logger.error({ err }, "Failed to fetch notifications");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const result = await db.collection("notifications").findOneAndUpdate(
      { notificationId: req.params["id"] },
      { $set: { read: true, readAt: new Date().toISOString() } },
      { returnDocument: "after", projection: { _id: 0 } }
    );

    if (!result) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Failed to mark notification as read");
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId } = req.body as { mobile?: string; farmerId?: string };

    const filter: Record<string, unknown> = { read: false };
    if (mobile) filter["mobile"] = mobile;
    if (farmerId) filter["farmerId"] = farmerId;

    const result = await db.collection("notifications").updateMany(
      filter,
      { $set: { read: true, readAt: new Date().toISOString() } }
    );

    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    logger.error({ err }, "Failed to mark all notifications as read");
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

router.post("/notifications/send", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId, type, title, body, data } = req.body as {
      mobile?: string;
      farmerId?: string;
      type?: string;
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
    };

    if (!title || !body) {
      res.status(400).json({ error: "title and body are required" });
      return;
    }

    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notification = {
      notificationId,
      mobile: mobile ?? null,
      farmerId: farmerId ?? null,
      type: type ?? "general",
      title,
      body,
      data: data ?? {},
      read: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    await db.collection("notifications").insertOne(notification);

    if (mobile) {
      const tokenDoc = await db.collection("push_tokens").findOne({ mobile });
      if (tokenDoc?.["pushToken"]) {
        try {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: tokenDoc["pushToken"],
              title,
              body,
              data: { type, ...data },
              sound: "default",
            }),
          });
        } catch (pushErr) {
          logger.warn({ pushErr }, "Push notification delivery failed (non-fatal)");
        }
      }
    }

    const { _id: _removed, ...clean } = notification as typeof notification & { _id?: unknown };
    res.status(201).json(clean);
  } catch (err) {
    logger.error({ err }, "Failed to send notification");
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
