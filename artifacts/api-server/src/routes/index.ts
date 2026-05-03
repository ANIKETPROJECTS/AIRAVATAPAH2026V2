import { Router, type IRouter } from "express";
import healthRouter from "./health";
import extractRouter from "./extract";
import farmersRouter from "./farmers";
import transliterateRouter from "./transliterate";
import schemesRouter from "./schemes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(extractRouter);
router.use(farmersRouter);
router.use(transliterateRouter);
router.use(schemesRouter);

export default router;
