const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// CREAR POST
router.post("/", async (req, res) => {
  try {
    const currentUser = await User.findById(req.body.userId);
    const newPost = new Post({
      ...req.body,
      userPic: currentUser.profilePic // Guardamos la foto
    });
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

// TIMELINE
router.get("/timeline/all", async (req, res) => {
  try { const posts = await Post.find().sort({ createdAt: -1 }); res.status(200).json(posts); } catch (err) { res.status(500).json(err); }
});

// PERFIL
router.get("/profile/:username", async (req, res) => {
  try { const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 }); res.status(200).json(posts); } catch (err) { res.status(500).json(err); }
});

// TAG
router.get("/tag/:tag", async (req, res) => {
  try { const tag = "#" + req.params.tag; const posts = await Post.find({ desc: { $regex: tag, $options: "i" } }).sort({ createdAt: -1 }); res.status(200).json(posts); } catch (err) { res.status(500).json(err); }
});

// BORRAR
router.delete("/:id", async (req, res) => {
  try { const post = await Post.findById(req.params.id); if (post.userId === req.body.userId) { await post.deleteOne(); res.status(200).json("Eliminado"); } else { res.status(403).json("Error"); } } catch (err) { res.status(500).json(err); }
});

// LIKE POST
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      if (post.userId !== req.body.userId) {
        const sender = await User.findById(req.body.userId);
        const newNoti = new Notification({ recipientId: post.userId, senderId: req.body.userId, senderName: sender.username, type: "like", postId: post._id });
        await newNoti.save();
      }
      res.status(200).json("Like");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Dislike");
    }
  } catch (err) { res.status(500).json(err); }
});

// COMENTAR (Aquí se asegura de guardar la foto y el ID)
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);
    
    const comment = {
      commentId: Math.random().toString(36).substr(2, 9), // ID ÚNICO NECESARIO PARA LIKES
      userId: req.body.userId,
      username: req.body.username,
      userPic: currentUser.profilePic, // FOTO REAL
      text: req.body.text,
      likes: [],
      createdAt: new Date()
    };
    
    await post.updateOne({ $push: { comments: comment } });

    if (post.userId !== req.body.userId) {
        const newNoti = new Notification({ recipientId: post.userId, senderId: req.body.userId, senderName: req.body.username, type: "comment", text: req.body.text, postId: post._id });
        await newNoti.save();
    }
    res.status(200).json(comment);
  } catch (err) { res.status(500).json(err); }
});

// LIKE COMENTARIO
router.put("/:id/comment/:commentId/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(c => c.commentId === req.params.commentId);
    if (!comment) return res.status(404).json("No existe");

    if (!comment.likes.includes(req.body.userId)) { comment.likes.push(req.body.userId); } 
    else { comment.likes = comment.likes.filter(id => id !== req.body.userId); }

    await post.markModified('comments');
    await post.save();
    res.status(200).json(comment.likes);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;