const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  // NUEVO CAMPO: DESCRIPCIÓN / BIO
  desc: { type: String, default: "", max: 100 }, 
  followers: { type: Array, default: [] }, 
  followings: { type: Array, default: [] },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);