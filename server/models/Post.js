const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userPic: { type: String, default: "" }, // <--- NUEVO: Guardamos la foto del autor en el post
  desc: { type: String, max: 500 },
  img: { type: String, required: true },
  likes: { type: Array, default: [] },
  
  // ESTRUCTURA AVANZADA DE COMENTARIOS
  comments: [
    {
      commentId: { type: String, required: true }, // ID único para el comentario
      userId: { type: String, required: true },
      username: { type: String, required: true },
      userPic: { type: String, default: "" }, // Foto del que comenta
      text: { type: String, required: true },
      likes: { type: Array, default: [] },    // Quién le dio like al comentario
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);