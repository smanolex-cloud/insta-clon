const router = require("express").Router();
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");
const axios = require("axios"); // NECESARIO PARA LAS RÉPLICAS

// ==================================================
// 🌐 SISTEMA DISTRIBUIDO (Lógica de Replicación)
// ==================================================

// 1. Obtener URLs de las réplicas desde Render
const REPLICAS = [
    process.env.REPLICA_1_URL, 
    process.env.REPLICA_2_URL
].filter(url => url); // Filtramos las que no existan

// 2. Cola de mensajes fallidos
let failedReplications = [];

// 3. Función para enviar datos a las réplicas
const replicateData = async (data) => {
    if (REPLICAS.length === 0) return; 

    console.log(`📡 [Líder] Replicando acción: ${data.action}`);
    
    REPLICAS.forEach(async (nodeUrl) => {
        try {
            await axios.post(`${nodeUrl}/replicate`, data);
            console.log(`✅ [Líder] Éxito en: ${nodeUrl}`);
        } catch (err) {
            console.error(`❌ [Líder] Fallo en ${nodeUrl}. Guardando en cola.`);
            failedReplications.push({ node: nodeUrl, data: data });
        }
    });
};

// 4. Recuperación Automática (Cada 20s intenta reenviar fallos)
setInterval(async () => {
    if (failedReplications.length > 0) {
        console.log(`🔄 Reintentando ${failedReplications.length} operaciones...`);
        
        const queue = [...failedReplications];
        failedReplications = []; 

        for (const item of queue) {
            try {
                await axios.post(`${item.node}/replicate`, item.data);
                console.log(`♻️ Recuperado: ${item.node}`);
            } catch (err) {
                failedReplications.push(item); // Si falla, vuelve a la cola
            }
        }
    }
}, 20000);

// ==================================================
// 📸 RUTAS DE LA API
// ==================================================

// 1. CREAR POST (CON REPLICACIÓN)
router.post("/", async (req, res) => {
  try {
    const currentUser = await User.findById(req.body.userId);
    const newPost = new Post({
      ...req.body,
      userPic: currentUser.profilePic // Guardamos la foto actual del usuario
    });
    const savedPost = await newPost.save();

    // 🔥 DISPARAR REPLICACIÓN 🔥
    replicateData({
        action: "NUEVO_POST",
        id: savedPost._id,
        user: savedPost.username,
        desc: savedPost.desc,
        img: savedPost.img,
        timestamp: new Date()
    });

    res.status(200).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

// 2. OBTENER TIMELINE (Con Paginación)
router.get("/timeline/all", async (req, res) => {
  try { 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
    res.status(200).json(posts);
  } catch (err) { res.status(500).json(err); }
});

// 3. OBTENER PERFIL
router.get("/profile/:username", async (req, res) => {
  try { 
      const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 }); 
      res.status(200).json(posts); 
  } catch (err) { res.status(500).json(err); }
});

// 4. BUSCAR POR TAG
router.get("/tag/:tag", async (req, res) => {
  try { 
      const tag = "#" + req.params.tag; 
      const posts = await Post.find({ desc: { $regex: tag, $options: "i" } }).sort({ createdAt: -1 }); 
      res.status(200).json(posts); 
  } catch (err) { res.status(500).json(err); }
});

// 5. BORRAR POST (CON REPLICACIÓN)
router.delete("/:id", async (req, res) => {
  try { 
      const post = await Post.findById(req.params.id); 
      if (post.userId === req.body.userId) { 
          await post.deleteOne(); 
          
          // 🔥 REPLICAR EL BORRADO 🔥
          replicateData({ action: "BORRAR_POST", id: req.params.id });
          
          res.status(200).json("Eliminado"); 
      } else { res.status(403).json("Error"); } 
  } catch (err) { res.status(500).json(err); }
});

// 6. LIKE AL POST
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

// 7. COMENTAR (Avanzado: con foto y ID)
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);
    
    const comment = {
      commentId: Math.random().toString(36).substr(2, 9), // ID único para likes
      userId: req.body.userId,
      username: req.body.username,
      userPic: currentUser.profilePic, // Foto actual
      text: req.body.text,
      likes: [],
      createdAt: new Date()
    };
    
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
    
    // Devolvemos el comentario completo para el frontend
    res.status(200).json(comment);
  } catch (err) { res.status(500).json(err); }
});

// 8. LIKE A COMENTARIO
router.put("/:id/comment/:commentId/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(c => c.commentId === req.params.commentId);
    
    if (!comment) return res.status(404).json("No existe");
    if (!comment.likes) comment.likes = []; // Protección para comentarios viejos

    if (!comment.likes.includes(req.body.userId)) {
      comment.likes.push(req.body.userId);
      
      // Notificación de Like a Comentario
      if (comment.userId !== req.body.userId) {
        const sender = await User.findById(req.body.userId);
        const newNoti = new Notification({ 
            recipientId: comment.userId, 
            senderId: req.body.userId, 
            senderName: sender.username, 
            type: "commentLike", 
            text: comment.text, 
            postId: post._id 
        });
        await newNoti.save();
      }
    } else {
      comment.likes = comment.likes.filter(id => id !== req.body.userId);
    }

    await post.markModified('comments'); // Importante para guardar arrays anidados
    await post.save();
    res.status(200).json(comment.likes);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;