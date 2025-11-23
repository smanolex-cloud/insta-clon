const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userPic: { type: String, default: "" },
  img: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // NUEVOS CAMPOS
  views: { type: Array, default: [] }, // Lista de IDs que vieron
  likes: { type: Array, default: [] }, // Lista de IDs que dieron like
}, { timestamps: true });

module.exports = mongoose.model("Story", StorySchema);