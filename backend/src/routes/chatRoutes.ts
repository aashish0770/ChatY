import { Router } from "express";
import { protectedRoute } from "../middleware/auth";
import { createChat, getChats } from "../controllers/chatController";

const router = Router();

router.use(protectedRoute);

router.get("/", getChats);
router.post("/with/:participantId", createChat);
export default router;
