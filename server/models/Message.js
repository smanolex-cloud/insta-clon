const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, default: "" },
  storyImg: { type: String, default: "" }, // <--- CAMPO NUEVO
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);