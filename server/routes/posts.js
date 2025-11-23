const router = require("express").Router();
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { replicateData } = require("../replicationService"); // <--- IMPORTAR SERVICIO

// 1. CREAR POST (CON REPLICACIÓN)
router.post("/", async (req, res) => {
  try {
    const currentUser = await User.findById(req.body.userId);
    const newPost = new Post({ ...req.body, userPic: currentUser.profilePic });
    const savedPost = await newPost.save();

    // 🔥 REPLICAR EL POST 🔥
    replicateData("NUEVO_POST", savedPost);

    res.status(200).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

// 2. LIKE AL POST (CON REPLICACIÓN)
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    // 🔥 REPLICAR LA ACCIÓN DE LIKE 🔥
    replicateData("LIKE_POST", { 
        postId: req.params.id, 
        userId: req.body.userId,
        action: post.likes.includes(req.body.userId) ? "remove" : "add"
    });

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

// 3. COMENTAR (CON REPLICACIÓN)
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);
    
    const comment = {
      commentId: Math.random().toString(36).substr(2, 9),
      userId: req.body.userId,
      username: req.body.username,
      userPic: currentUser.profilePic,
      text: req.body.text,
      likes: [],
      createdAt: new Date()
    };
    
    await post.updateOne({ $push: { comments: comment } });

    // 🔥 REPLICAR EL COMENTARIO 🔥
    replicateData("NUEVO_COMENTARIO", { 
        postId: req.params.id, 
        commentData: comment 
    });

    if (post.userId !== req.body.userId) {
        const newNoti = new Notification({ recipientId: post.userId, senderId: req.body.userId, senderName: req.body.username, type: "comment", text: req.body.text, postId: post._id });
        await newNoti.save();
    }
    res.status(200).json(comment);
  } catch (err) { res.status(500).json(err); }
});

// 4. LIKE A COMENTARIO (CON REPLICACIÓN)
router.put("/:id/comment/:commentId/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(c => c.commentId === req.params.commentId);
    if (!comment) return res.status(404).json("No existe");

    // 🔥 REPLICAR LIKE A COMENTARIO 🔥
    replicateData("LIKE_COMENTARIO", { 
        postId: req.params.id, 
        commentId: req.params.commentId, 
        userId: req.body.userId 
    });

    if (!comment.likes.includes(req.body.userId)) {
      comment.likes.push(req.body.userId);
      if (comment.userId !== req.body.userId) {
        const sender = await User.findById(req.body.userId);
        const newNoti = new Notification({ recipientId: comment.userId, senderId: req.body.userId, senderName: sender.username, type: "commentLike", text: comment.text, postId: post._id });
        await newNoti.save();
      }
    } else {
      comment.likes = comment.likes.filter(id => id !== req.body.userId);
    }
    await post.markModified('comments');
    await post.save();
    res.status(200).json(comment.likes);
  } catch (err) { res.status(500).json(err); }
});

// 5. BORRAR POST
router.delete("/:id", async (req, res) => {
  try { 
      const post = await Post.findById(req.params.id); 
      if (post.userId === req.body.userId) { 
          await post.deleteOne(); 
          
          // 🔥 REPLICAR BORRADO 🔥
          replicateData("BORRAR_POST", { postId: req.params.id });
          
          res.status(200).json("Eliminado"); 
      } else { res.status(403).json("Error"); } 
  } catch (err) { res.status(500).json(err); }
});

// RUTAS DE LECTURA (Sin cambios, no necesitan replicarse porque solo leen)
router.get("/timeline/all", async (req, res) => { try { const page = parseInt(req.query.page)||1; const limit = parseInt(req.query.limit)||5; const skip = (page-1)*limit; const posts = await Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit); res.status(200).json(posts); } catch (err) { res.status(500).json(err); } });
router.get("/profile/:username", async (req, res) => { try { const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 }); res.status(200).json(posts); } catch (err) { res.status(500).json(err); } });
router.get("/tag/:tag", async (req, res) => { try { const tag = "#" + req.params.tag; const posts = await Post.find({ desc: { $regex: tag, $options: "i" } }).sort({ createdAt: -1 }); res.status(200).json(posts); } catch (err) { res.status(500).json(err); } });

module.exports = router;