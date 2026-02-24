import express from "express";

import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";

const app = express();

//Middleware that integrates Clerk authentication into your Express application.
//It checks the request's cookies and headers for a session JWT and, if found,
//  attaches the Auth object to the request object under the auth key.
app.use(clerkMiddleware());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, ChatY API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// error handling middleware should be the last middleware added to the stack
app.use(errorHandler);

// server frontend assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../web/dist")));

  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
  });
}

export default app;
