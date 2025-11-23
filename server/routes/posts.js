const router = require("express").Router();
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");

// CREAR POST
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

// OBTENER TODOS
router.get("/timeline/all", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) { res.status(500).json(err); }
});

// OBTENER PERFIL
router.get("/profile/:username", async (req, res) => {
  try {
    const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) { res.status(500).json(err); }
});

// BORRAR
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("Eliminado");
    } else { res.status(403).json("Error"); }
  } catch (err) { res.status(500).json(err); }
});

// LIKE
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      
      // Notificación
      if (post.userId !== req.body.userId) {
        const sender = await User.findById(req.body.userId);
        const newNoti = new Notification({
          recipientId: post.userId,
          senderId: req.body.userId,
          senderName: sender.username,
          type: "like",
          postId: post._id
        });
        await newNoti.save();
      }
      res.status(200).json("Like");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Dislike");
    }
  } catch (err) { res.status(500).json(err); }
});

// COMENTAR
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = { username: req.body.username, text: req.body.text, userId: req.body.userId, createdAt: new Date() };
    await post.updateOne({ $push: { comments: comment } });

    // Notificación
    if (post.userId !== req.body.userId) {
        const newNoti = new Notification({
          recipientId: post.userId,
          senderId: req.body.userId,
          senderName: req.body.username,
          type: "comment",
          text: req.body.text,
          postId: post._id
        });
        await newNoti.save();
    }
    res.status(200).json(comment);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;