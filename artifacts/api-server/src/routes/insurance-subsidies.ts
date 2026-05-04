import { Router, type IRouter } from "express";
import { getDb } from "../lib/mongo";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/insurance-subsidies", async (req, res): Promise<void> => {
  try {
    const db = getDb();

    const type   = typeof req.query["type"]   === "string" ? req.query["type"]   : undefined;
    const region = typeof req.query["region"] === "string" ? req.query["region"] : undefined;
    const search = typeof req.query["search"] === "string" ? req.query["search"].trim() : undefined;
    const pageRaw  = typeof req.query["page"]  === "string" ? parseInt(req.query["page"],  10) : 0;
    const limitRaw = typeof req.query["limit"] === "string" ? parseInt(req.query["limit"], 10) : 10;

    const page  = isNaN(pageRaw)  || pageRaw  < 0 ? 0  : pageRaw;
    const limit = isNaN(limitRaw) || limitRaw < 1 || limitRaw > 100 ? 10 : limitRaw;

    const filter: Record<string, unknown> = {};
    if (type   === "Insurance" || type   === "Subsidy")     filter["type"]   = type;
    if (region === "Central"   || region === "Maharashtra") filter["region"] = region;
    if (search) filter["name"] = { $regex: search, $options: "i" };

    const [items, total] = await Promise.all([
      db.collection("insurance_subsidies")
        .find(filter, { projection: { _id: 0 } })
        .sort({ region: 1, type: 1, name: 1 })
        .skip(page * limit)
        .limit(limit)
        .toArray(),
      db.collection("insurance_subsidies").countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch insurance subsidies");
    res.status(500).json({ error: "Failed to fetch insurance subsidies" });
  }
});

router.get("/insurance-subsidies/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const item = await db
      .collection("insurance_subsidies")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });

    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to fetch insurance subsidy");
    res.status(500).json({ error: "Failed to fetch insurance subsidy" });
  }
});

export default router;
