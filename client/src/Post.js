import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css"; 

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 
const DEFAULT_IMG = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function Post({ post, user, handleDelete }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes.includes(user._id));
  }, [user._id, post.likes]);

  const likeHandler = () => {
    try { axios.put(`${API_URL}/posts/${post._id}/like`, { userId: user._id }); } catch (err) {}
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  const handleDoubleTap = () => {
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800); 
    if (!isLiked) likeHandler();
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

  // --- LIKE A COMENTARIO ---
  const likeComment = async (commentId) => {
    if (!commentId) return alert("Este comentario es antiguo y no soporta likes. Crea uno nuevo.");

    try {
        const res = await axios.put(`${API_URL}/posts/${post._id}/comment/${commentId}/like`, {
            userId: user._id
        });
        
        // Actualizar visualmente
        const updatedComments = comments.map(c => {
            if(c.commentId === commentId) {
                return { ...c, likes: res.data }; 
            }
            return c;
        });
        setComments(updatedComments);
    } catch(err) { console.log(err); }
  };

  const replyToComment = (username) => { setCommentText(`@${username} `); };

  const formatText = (text) => {
    if (!text) return "";
    return text.split(" ").map((word, i) => {
      if (word.startsWith("#")) return <span key={i} style={{color: "#ba68c8", fontWeight: "bold", cursor:"pointer"}} onClick={() => window.location.href=`/tag/${word.substring(1)}`}>{word} </span>;
      if (word.startsWith("@")) return <span key={i} style={{color: "#90caf9", fontWeight: "bold", cursor:"pointer"}} onClick={() => window.location.href=`/profile/${word.substring(1)}`}>{word} </span>;
      return word + " ";
    });
  };

  return (
    <div className="post">
      <div className="post-header">
        <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
            <img src={post.userPic || DEFAULT_IMG} alt="" style={{width:"35px", height:"35px", borderRadius:"50%", objectFit:"cover", cursor:"pointer", border: "1px solid #333"}} onClick={() => window.location.href=`/profile/${post.username}`}/>
            <span className="post-username" onClick={() => window.location.href=`/profile/${post.username}`} style={{cursor: "pointer"}}>{post.username}</span>
        </div>
        <span className="post-date">{new Date(post.createdAt).toDateString()}</span>
      </div>
      
      <div className="post-img-container" onDoubleClick={handleDoubleTap} style={{position: "relative", cursor: "pointer"}}>
        <img className="post-img" src={post.img} alt="" />
        <div className={`heart-overlay ${showHeartOverlay ? "animate" : ""}`}>❤️</div>
      </div>

      <div className="post-bottom">
        <div className="post-actions">
          <span onClick={likeHandler} style={{cursor:"pointer", fontSize:"24px", marginRight:"15px"}}>{isLiked ? "❤️" : "🤍"}</span>
          <span onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", fontSize:"24px"}}>💬</span>
        </div>
        
        <div className="post-info">
          <span style={{fontWeight:"bold", display:"block", marginBottom:"5px"}}>{like} Me gusta</span>
          <span className="post-desc"><span style={{fontWeight:"bold", marginRight:"5px"}}>{post.username}</span>{formatText(post.desc)}</span>
          <p onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", color:"#a0a0a0", fontSize:"13px", marginTop:"5px"}}>Ver los {comments.length} comentarios</p>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((c, i) => (
              <div key={i} className="comment-item-row">
                <img src={c.userPic || DEFAULT_IMG} alt="" style={{width:"25px", height:"25px", borderRadius:"50%", objectFit:"cover", marginRight:"10px", border: "1px solid #333"}} />
                <div style={{flex:1}}>
                    <span style={{fontWeight:"bold", color:"white", fontSize:"13px", cursor:"pointer"}} onClick={() => window.location.href=`/profile/${c.username}`}>{c.username} </span> 
                    <span style={{fontSize:"13px", marginLeft: "5px"}}>{formatText(c.text)}</span>
                    <div style={{display:"flex", gap:"15px", marginTop:"2px", alignItems:"center"}}>
                        <span style={{fontSize:"10px", color:"#a0a0a0", cursor:"pointer"}} onClick={() => replyToComment(c.username)}>Responder</span>
                        {c.likes && c.likes.length > 0 && <span style={{fontSize:"10px", color:"#a0a0a0"}}>{c.likes.length} likes</span>}
                    </div>
                </div>
                {/* BOTÓN LIKE COMENTARIO */}
                <span onClick={() => likeComment(c.commentId)} style={{cursor:"pointer", fontSize:"12px", marginLeft:"5px", color: c.likes && c.likes.includes(user._id) ? "red" : "gray"}}>
                    {c.likes && c.likes.includes(user._id) ? "❤️" : "🤍"}
                </span>
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