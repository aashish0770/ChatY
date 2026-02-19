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
      const { userId: clerkId } = getAuth(req);

      if (!clerkId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findOne({ clerkId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Attach the user to the request object for use in subsequent middleware/routes
      req.userId = user.id.toString();
    } catch (error) {
      res.status(500);
      next(error);
    }
  },
];
