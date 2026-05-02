import { Router, type IRouter } from "express";
import healthRouter from "./health";
import extractRouter from "./extract";
import farmersRouter from "./farmers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(extractRouter);
router.use(farmersRouter);

export default router;
