import { Schema, model, models, Document, Types } from "mongoose";

export interface IComment extends Document {
  ticketId: Types.ObjectId;
  author: Types.ObjectId | {
    _id: string;
    name: string;
    role: "client" | "agent";
  };
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, required: true, ref: "Ticket" },
  author: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  message: { type: String, required: true },
}, { timestamps: true });

const Comment = models.Comment || model<IComment>("Comment", commentSchema);

export default Comment;
