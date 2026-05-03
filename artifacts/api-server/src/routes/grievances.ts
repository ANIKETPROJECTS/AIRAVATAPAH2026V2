import { Router } from "express";
import crypto from "node:crypto";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router = Router();

router.get("/grievances", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId, status } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (mobile) filter["mobile"] = mobile;
    if (farmerId) filter["farmerId"] = farmerId;
    if (status) filter["status"] = status;

    const grievances = await db
      .collection("grievances")
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(grievances);
  } catch (err) {
    logger.error({ err }, "Failed to fetch grievances");
    res.status(500).json({ error: "Failed to fetch grievances" });
  }
});

router.get("/grievances/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const grievance = await db
      .collection("grievances")
      .findOne({ grievanceId: req.params["id"] }, { projection: { _id: 0 } });

    if (!grievance) {
      res.status(404).json({ error: "Grievance not found" });
      return;
    }
    res.json(grievance);
  } catch (err) {
    logger.error({ err }, "Failed to fetch grievance");
    res.status(500).json({ error: "Failed to fetch grievance" });
  }
});

router.post("/grievances", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { mobile, farmerId, category, subject, description } = req.body as {
      mobile?: string;
      farmerId?: string;
      category?: string;
      subject?: string;
      description?: string;
    };

    if (!mobile || !subject || !description) {
      res.status(400).json({ error: "mobile, subject, and description are required" });
      return;
    }

    const grievanceId = `GRV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const grievance = {
      grievanceId,
      mobile,
      farmerId: farmerId ?? null,
      category: category ?? "General",
      subject,
      description,
      status: "Open",
      adminReply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("grievances").insertOne(grievance);
    const { _id: _removed, ...clean } = grievance as typeof grievance & { _id?: unknown };
    res.status(201).json(clean);
  } catch (err) {
    logger.error({ err }, "Failed to create grievance");
    res.status(500).json({ error: "Failed to create grievance" });
  }
});

router.patch("/grievances/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { status, adminReply } = req.body as { status?: string; adminReply?: string };

    const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (status) updates["status"] = status;
    if (adminReply !== undefined) updates["adminReply"] = adminReply;

    const result = await db.collection("grievances").findOneAndUpdate(
      { grievanceId: req.params["id"] },
      { $set: updates },
      { returnDocument: "after", projection: { _id: 0 } }
    );

    if (!result) {
      res.status(404).json({ error: "Grievance not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Failed to update grievance");
    res.status(500).json({ error: "Failed to update grievance" });
  }
});

export default router;
