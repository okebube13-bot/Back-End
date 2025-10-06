const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    Username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String },
    body: { type: String },
    author: { type: String },
    Author: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const blog = mongoose.model("blog", BlogSchema);
module.exports = { blog, User };
