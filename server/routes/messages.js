const router = require("express").Router();
const Message = require("../models/Message");

// 1. ENVIAR UN MENSAJE
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. LEER MENSAJES ENTRE DOS PERSONAS
// Buscamos mensajes donde: (Yo soy emisor Y Tú receptor) O (Tú emisor Y Yo receptor)
router.get("/:myId/:friendId", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.params.myId, receiverId: req.params.friendId },
        { senderId: req.params.friendId, receiverId: req.params.myId },
      ],
    }).sort({ createdAt: 1 }); // Ordenamos por fecha (antiguos primero)
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;