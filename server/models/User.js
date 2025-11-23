const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  followers: { type: Array, default: [] }, // Lista de gente que lo sigue
  following: { type: Array, default: [] }, // Lista de gente a la que sigue
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true }); // Esto guarda automáticamente la fecha de creación

module.exports = mongoose.model("User", UserSchema);