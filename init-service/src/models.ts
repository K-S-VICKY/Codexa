import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export interface IProject extends Document {
  ownerId: mongoose.Types.ObjectId;
  replId: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  replId: { type: String, required: true, unique: true },
  language: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);


