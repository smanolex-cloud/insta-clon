import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css"; 

const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Post({ post, user, handleDelete }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes.includes(user._id));
  }, [user._id, post.likes]);

  const likeHandler = () => {
    try {
      axios.put(`${API_URL}/posts/${post._id}/like`, { userId: user._id });
    } catch (err) {}
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
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

  return (
    <div className="post">
      <div className="post-header">
        {/* ENLACE AL PERFIL AQUÍ */}
        <span 
          className="post-username" 
          onClick={() => window.location.href=`/profile/${post.username}`}
          style={{cursor: "pointer"}}
        >
          {post.username}
        </span>
        <span className="post-date">{new Date(post.createdAt).toDateString()}</span>
      </div>
      
      <div className="post-center">
        <span className="post-text">{post.desc}</span>
        <img className="post-img" src={post.img} alt="" onDoubleClick={likeHandler} />
      </div>

      <div className="post-bottom">
        <div className="post-actions">
          <span onClick={likeHandler} style={{cursor:"pointer", fontSize:"22px", marginRight:"10px"}}>{isLiked ? "❤️" : "🤍"}</span>
          <span onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", fontSize:"22px"}}>💬</span>
        </div>
        <div className="post-info">
          <span>{like} Me gusta</span> • 
          <span onClick={() => setShowComments(!showComments)} style={{cursor:"pointer", marginLeft:"5px"}}>{comments.length} comentarios</span>
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((c, i) => (
              <div key={i} className="comment-item"><strong>{c.username}: </strong> {c.text}</div>
            ))}
          </div>
          <form onSubmit={submitComment} className="comment-form">
            <input type="text" placeholder="Escribe un comentario..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit">Publicar</button>
          </form>
        </div>
      )}

      {post.userId === user._id && <button className="delete-btn" onClick={() => handleDelete(post._id)}>🗑️ Borrar</button>}
    </div>
  );
}