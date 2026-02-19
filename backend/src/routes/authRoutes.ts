import { Router } from "express";
import { authCallback, getUser } from "../controllers/authController";
import { protectedRoute } from "../middleware/auth";

const router = Router();

// Get the currently authenticated user
router.get("/me", protectedRoute, getUser);
router.post("/callback", authCallback);

export default router;
