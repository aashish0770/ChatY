import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { User } from "../models/User";

// This map will store the mapping of userId to socketId for all online users
export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (server: HttpServer) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8081",
    process.env.FRONTEND_URL as string,
    process.env.MOBILE_APP_URL as string,
  ].filter(Boolean) as string[];

  const io = new SocketServer(server, { cors: { origin: allowedOrigins } });

  // verify socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // this is the token sent from the client during connection
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const user = await User.findOne({ clerkId: session.sub });
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.data.userId = user._id.toString();
      next();
    } catch (error: any) {
      console.error("Socket authentication error:", error);
      next(new Error(error.message || "Authentication error"));
    }
  });

  // this connection handler will be called for each new socket connection
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    //send the list of current online user to the newly connected user
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

    // add the new user to the online users map
    onlineUsers.set(userId, socket.id);

    //notify other that this user is now online
    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`); // join a room specific to this user for private messaging

    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    // handle incoming messages
    socket.on(
      "send-message",
      async (data: { chatId: string; text: string }) => {
        try {
          const { chatId, text } = data;

          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });

          if (!chat) {
            socket.emit("socket-error", {
              message: "Chat not found",
            });
            return;
          }

          const message = new Message({
            chat: chatId,
            sender: userId,
            text,
          });

          chat.lastMessage = message._id;
          chat.lastMessageAt = new Date();
          await chat.save();

          await message.populate("sender", "name avatar");

          io.to(`chat:${chatId}`).emit("new-message", message);

          // also emit to participants' personal rooms (for chat list view)
          for (const participant of chat.participants) {
            io.to(`user:${participant.toString()}`).emit(
              "new-message",
              message,
            );
          }
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("socket-error", {
            message: "Failed to send message",
          });
        }
      },
    );

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      //notify other that this user is now offline
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};
