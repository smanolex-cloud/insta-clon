const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true }, // <--- ESTO ES LO NUEVO: Guardamos tu nombre
  desc: { type: String, max: 500 },
  img: { type: String, required: true }, // El link de la foto
  likes: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);