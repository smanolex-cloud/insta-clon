const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userPic: { type: String, default: "" }, // Foto de perfil del autor
  img: { type: String, required: true }, // La foto de la historia
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Story", StorySchema);