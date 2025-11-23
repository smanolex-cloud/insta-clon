const router = require("express").Router();
const Story = require("../models/Story");
const User = require("../models/User");

// 1. SUBIR HISTORIA
router.post("/", async (req, res) => {
  try {
    // Buscamos al usuario para guardar su foto de perfil actual en la historia
    const currentUser = await User.findById(req.body.userId);
    
    const newStory = new Story({
      userId: req.body.userId,
      username: currentUser.username,
      userPic: currentUser.profilePic,
      img: req.body.img
    });
    
    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. OBTENER HISTORIAS (SOLO LAS DE LAS ÚLTIMAS 24 HORAS)
router.get("/all", async (req, res) => {
  try {
    // Calculamos la fecha de hace 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscamos historias creadas DESPUÉS de esa fecha
    const stories = await Story.find({ 
      createdAt: { $gt: oneDayAgo } 
    }).sort({ createdAt: -1 });

    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;