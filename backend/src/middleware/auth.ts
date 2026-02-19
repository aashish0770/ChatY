import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { User } from "../models/User";
import { requireAuth } from "@clerk/express";

export type AuthRequest = Request & {
  userId?: string; // This will hold the authenticated user's ID after validation
};

export const protectedRoute = [
  requireAuth(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: clerkUserId } = getAuth(req);

      if (!clerkUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findOne({ clerkUserId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Attach the user to the request object for use in subsequent middleware/routes
      req.userId = user.id.toString();
      next();
    } catch (error) {
      console.error("Error in protectedRoute middleware:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
