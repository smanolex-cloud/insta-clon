const router = require("express").Router();
const Story = require("../models/Story");
const User = require("../models/User");
const Notification = require("../models/Notification"); // Para notificar likes

// 1. SUBIR HISTORIA
router.post("/", async (req, res) => {
  try {
    const currentUser = await User.findById(req.body.userId);
    const newStory = new Story({
      userId: req.body.userId,
      username: currentUser.username,
      userPic: currentUser.profilePic,
      img: req.body.img
    });
    const savedStory = await newStory.save();
    res.status(200).json(savedStory);
  } catch (err) { res.status(500).json(err); }
});

// 2. OBTENER HISTORIAS (24h)
router.get("/all", async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({ createdAt: { $gt: oneDayAgo } }).sort({ createdAt: -1 });
    res.status(200).json(stories);
  } catch (err) { res.status(500).json(err); }
});

// 3. MARCAR COMO VISTO (NUEVO)
router.put("/:id/view", async (req, res) => {
  try {
    // $addToSet agrega el ID solo si no existe (para no contar vistas dobles)
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { views: req.body.userId }
    });
    res.status(200).json("Visto");
  } catch (err) { res.status(500).json(err); }
});

// 4. DAR LIKE A HISTORIA (NUEVO)
router.put("/:id/like", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story.likes.includes(req.body.userId)) {
      await story.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("Like agregado");
    } else {
      await story.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Like quitado");
    }
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;