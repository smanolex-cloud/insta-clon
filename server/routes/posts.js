const router = require("express").Router();
const Post = require("../models/Post");

// 1. CREAR POST
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

// 2. OBTENER TODOS (FEED)
router.get("/timeline/all", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) { res.status(500).json(err); }
});

// 3. BORRAR POST
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("Post eliminado");
    } else { res.status(403).json("No puedes borrar posts ajenos"); }
  } catch (err) { res.status(500).json(err); }
});

// 4. DAR / QUITAR LIKE (NUEVO)
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("Like agregado");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Like quitado");
    }
  } catch (err) { res.status(500).json(err); }
});

// 5. COMENTAR (NUEVO)
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = {
      username: req.body.username,
      text: req.body.text,
      userId: req.body.userId,
      createdAt: new Date()
    };
    await post.updateOne({ $push: { comments: comment } });
    res.status(200).json(comment);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;