import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { clerkClient, getAuth } from "@clerk/express";

export async function getUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-clerkUserId -__v");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function authCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) {
      return res
        .status(400)
        .json({ message: "Unauthorized: User ID not found" });
    }

    let user = await User.findOne({ clerkUserId });

    if (!user) {
      // User not found, create a new user
      // get the user from and save in our database
      const clerkUser = await clerkClient.users.getUser(clerkUserId);

      user = await User.create({
        clerkId: clerkUserId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
          : clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] || "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "Unknown",
        avatar: clerkUser.imageUrl,
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
