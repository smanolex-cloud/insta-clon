import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import "./Profile.css"; // Reusamos estilos del perfil (Grid)

// URL DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function TagResults() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // Para el modal
  const tag = useParams().tag; 
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchTagPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/posts/tag/${tag}`);
        setPosts(res.data);
      } catch (err) { console.error(err); }
    };
    fetchTagPosts();
  }, [tag]);

  return (
    <div className="profile-container">
      <button className="back-btn-profile" onClick={() => window.location.href = "/"}>⬅ Volver al Inicio</button>
      
      <div className="profile-header" style={{justifyContent: "center", flexDirection: "column", textAlign:"center"}}>
        <div style={{width:"100px", height:"100px", borderRadius:"50%", border:"2px solid #333", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px", marginBottom:"20px", color:"#e0e0e0"}}>
            #
        </div>
        <h2 className="profile-username">#{tag}</h2>
        <p style={{color:"gray"}}>{posts.length} publicaciones</p>
      </div>

      <hr className="profile-divider"/>

      <div className="profile-grid">
        {posts.length === 0 ? (
            <p style={{textAlign:"center", width:"100%", color:"gray"}}>No hay fotos con este hashtag.</p>
        ) : (
            posts.map((p) => (
            <div key={p._id} className="grid-item" onClick={() => setSelectedPost(p)}>
                <img src={p.img} alt="" className="grid-img" />
                <div className="grid-overlay">
                    <span>❤️ {p.likes.length}</span>
                    <span>💬 {p.comments.length}</span>
                </div>
            </div>
            ))
        )}
      </div>

      {/* MODAL PARA VER LA FOTO AL DAR CLIC */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-img-container"><img src={selectedPost.img} alt="" className="modal-img" /></div>
            <div className="modal-info">
                <div className="modal-header"><b>{selectedPost.username}</b></div>
                <div className="modal-desc"><p>{selectedPost.desc}</p></div>
                <div className="modal-stats"><span>❤️ {selectedPost.likes.length}</span><span style={{marginLeft:"15px"}}>💬 {selectedPost.comments.length}</span></div>
                <button className="modal-close-btn" onClick={() => setSelectedPost(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}