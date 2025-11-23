const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true }, // Para quién es
  senderId: { type: String, required: true },    // Quién la mandó
  senderName: { type: String, required: true },  // Nombre de quien la mandó
  type: { type: String, required: true },        // 'like', 'comment', 'follow', 'message'
  text: { type: String, default: "" },           // Texto extra
  postId: { type: String, default: "" },         // ID del post (si aplica)
  isRead: { type: Boolean, default: false },     // Leída o no
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);