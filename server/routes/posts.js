const router = require("express").Router();
const Post = require("../models/Post");

// 1. CREAR UN POST (Subir foto)
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. OBTENER TODOS LOS POSTS (El Feed)
router.get("/timeline/all", async (req, res) => {
  try {
    // Buscamos todos los posts y los ordenamos del más nuevo al más viejo
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. BORRAR UN POST (Nueva función)
router.delete("/:id", async (req, res) => {
  try {
    // Buscamos el post por su ID
    const post = await Post.findById(req.params.id);
    
    // Verificamos si el post existe
    if (!post) return res.status(404).json("El post no existe");

    // Verificamos si el usuario que quiere borrar es el dueño
    // (Comparamos el ID del dueño del post con el ID que nos mandan)
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("El post ha sido eliminado");
    } else {
      res.status(403).json("No puedes borrar posts de otros");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;