const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },   // El que envía
  receiverId: { type: String, required: true }, // El que recibe
  text: { type: String, required: true },       // El mensaje
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);