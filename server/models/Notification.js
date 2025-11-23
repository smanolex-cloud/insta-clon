const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true }, // Para quién es
  senderId: { type: String, required: true },    // Quién la provocó
  senderName: { type: String, required: true },  // Nombre de quien la provocó
  type: { type: String, required: true },        // 'like', 'comment', 'follow'
  text: { type: String, default: "" },           // El comentario (si aplica)
  postId: { type: String, default: "" },         // A qué foto fue (si aplica)
  isRead: { type: Boolean, default: false },     // ¿Ya la vio?
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);