import mongoose, { Schema, type Document } from "mongoose";

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId; // Reference to the Chat
  sender: mongoose.Types.ObjectId; // Reference to the User who sent the message
  text: string; // Message content
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create an index on the chat field to optimize queries for messages in a specific chat
MessageSchema.index({ chat: 1, createdAt: 1 }); // see the odler msg first
// 1 for ascending order, -1 for descending order

export const Message = mongoose.model("Message", MessageSchema);
