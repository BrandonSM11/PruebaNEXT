import { Schema, model, models, Model } from "mongoose";
import { Types } from "mongoose";

export interface Ticket {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  name: string;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  comments?: Types.ObjectId[];
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TicketSchema = new Schema<Ticket>(
  {
    title: {
      type: String,
      required: [true, "El título del ticket es obligatorio"],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
    },
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
    },
   createdBy: { 
    type: Schema.Types.ObjectId, // 👈 DEBE SER ObjectId
    ref: 'User', 
    required: true 
},
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: {
        values: ["open", "in_progress", "resolved", "closed"],
        message: "El estado debe ser: open, in_progress, resolved o closed",
      },
      default: "open",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "La prioridad debe ser: low, medium o high",
      },
      default: "medium",
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
    },
  },
  { versionKey: false, timestamps: true }
);

const TicketModel: Model<Ticket> =
  models.Ticket || model<Ticket>("Ticket", TicketSchema);

export default TicketModel;