const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  desc: { type: String, max: 500 },
  img: { type: String, required: true },
  likes: { type: Array, default: [] },
  comments: { type: Array, default: [] }, // <--- ESTO ES LO NUEVO
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);