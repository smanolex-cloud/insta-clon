const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, default: "" },
  storyImg: { type: String, default: "" }, // Para respuestas a historias
  img: { type: String, default: "" },      // <--- NUEVO: Para fotos normales enviadas en chat
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);