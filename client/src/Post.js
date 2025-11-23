import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css"; 

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Post({ post, user, handleDelete }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  
  // Estado para la animación del corazón gigante
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes.includes(user._id));
  }, [user._id, post.likes]);

  // FUNCIÓN DE LIKE (Normal)
  const likeHandler = () => {
    try {
      axios.put(`${API_URL}/posts/${post._id}/like`, { userId: user._id });
    } catch (err) {}
    
    // Si ya le di like, resto 1. Si no, sumo 1.
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  // FUNCIÓN DOBLE TAP (Like con animación)
  const handleDoubleTap = () => {
    // Mostrar corazón blanco
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800); // Desaparece a los 0.8s

    // Si NO le había dado like, se lo doy. Si ya tenía, no hago nada (Instagram no quita el like con doble tap)
    if (!isLiked) {
      likeHandler();
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText) return;
    try {
      const res = await axios.put(`${API_URL}/posts/${post._id}/comment`, {
        userId: user._id,
        username: user.username,
        text: commentText
      });
      setComments([...comments, res.data]);
      setCommentText("");
    } catch (err) { console.log(err); }
  };

  // FUNCIÓN PARA DETECTAR HASHTAGS Y MENCIONES
  const formatText = (text) => {
    if (!text) return "";
    return text.split(" ").map((word, i) => {
      if (word.startsWith("#") || word.startsWith("@")) {
        return <span key={i} style={{color: "#e0f2fe", fontWeight: "bold", cursor:"pointer"}}>{word} </span>;
      }
      return word + " ";
    });
  };

  return (
    <div className="post">
      <div className="post-header">
        <span 
          className="post-username" 
          onClick={() => window.location.href=`/profile/${post.username}`}
          style={{cursor: "pointer"}}
        >
          {post.username}
        </span>
        <span className="post-date">{new Date(post.createdAt).toDateString()}</span>
      </div>
      
      {/* CONTENEDOR DE IMAGEN CON DOBLE TAP */}
      <div className="post-img-container" onDoubleClick={handleDoubleTap} style={{position: "relative", cursor: "pointer"}}>
        <img className="post-img" src={post.img} alt="" />
        
        {/* CORAZÓN ANIMADO (Solo aparece al hacer doble tap) */}
        <div className={`heart-overlay ${showHeartOverlay ? "animate" : ""}`}>❤️</div>
      </div>

      <div className="post-bottom">
        <div className="post-actions">
          <span onClick={likeHandler} style={{cursor:"pointer", fontSize:"24px", marginRight:"15px"}}>
            {isLiked ? "❤️" : "🤍"}
          </span>
          <span onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", fontSize:"24px"}}>💬</span>
        </div>
        
        <div className="post-info">
          <span style={{fontWeight:"bold", display:"block", marginBottom:"5px"}}>{like} Me gusta</span>
          
          {/* DESCRIPCIÓN CON HASHTAGS */}
          <span className="post-desc">
            <span style={{fontWeight:"bold", marginRight:"5px"}}>{post.username}</span>
            {formatText(post.desc)}
          </span>
          
          <p onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", color:"#a0a0a0", fontSize:"13px", marginTop:"5px"}}>
            Ver los {comments.length} comentarios
          </p>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((c, i) => (
              <div key={i} className="comment-item">
                <span style={{fontWeight:"bold", color:"white"}}>{c.username} </span> 
                {formatText(c.text)}
              </div>
            ))}
          </div>
          <form onSubmit={submitComment} className="comment-form">
            <input type="text" placeholder="Agrega un comentario..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit" disabled={!commentText}>Publicar</button>
          </form>
        </div>
      )}

      {post.userId === user._id && <button className="delete-btn" onClick={() => handleDelete(post._id)}>🗑️ Borrar</button>}
    </div>
  );
}