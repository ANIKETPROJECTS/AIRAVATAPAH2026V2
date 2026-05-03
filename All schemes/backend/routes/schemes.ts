import { Router, type IRouter } from "express";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/schemes", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const type = typeof req.query["type"] === "string" ? req.query["type"] : undefined;
    const search = typeof req.query["search"] === "string" ? req.query["search"].trim() : undefined;

    const filter: Record<string, unknown> = {};
    if (type && (type === "CENTRAL" || type === "STATE")) {
      filter["type"] = type;
    }
    if (search) {
      filter["name"] = { $regex: search, $options: "i" };
    }

    const schemes = await db.collection("schemes").find(filter, { projection: { _id: 0 } }).sort({ type: 1, name: 1 }).toArray();
    res.json(schemes);
  } catch (err) {
    logger.error({ err }, "Failed to fetch schemes");
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
});

router.get("/schemes/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const scheme = await db.collection("schemes").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!scheme) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    res.json(scheme);
  } catch (err) {
    logger.error({ err }, "Failed to fetch scheme");
    res.status(500).json({ error: "Failed to fetch scheme" });
  }
});

router.patch("/schemes/:id/status", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const { status } = req.body as { status?: string };
    if (status !== "Active" && status !== "Closed") {
      res.status(400).json({ error: "status must be 'Active' or 'Closed'" });
      return;
    }
    const result = await db.collection("schemes").findOneAndUpdate(
      { id: req.params.id },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    if (!result) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Failed to update scheme status");
    res.status(500).json({ error: "Failed to update scheme status" });
  }
});

export default router;
