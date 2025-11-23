import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import "./Profile.css"; 

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 
// TUS DATOS
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Profile() {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [followed, setFollowed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // ESTADO PARA EL MODAL (FOTO ABIERTA)
  const [selectedPost, setSelectedPost] = useState(null); // null = cerrado

  const username = useParams().username;
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const profileInputRef = useRef();

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/users/u/${username}`);
        setUser(userRes.data);
        const postsRes = await axios.get(`${API_URL}/posts/profile/${username}`);
        setPosts(postsRes.data);
        const myProfileRes = await axios.get(`${API_URL}/users/${currentUser._id}`);
        if (myProfileRes.data.followings.includes(userRes.data._id)) setFollowed(true);
      } catch (err) {}
    };
    fetchUserAndPosts();
  }, [username, currentUser._id]);

  const uploadImage = async (file) => {
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      setIsUploading(false);
      return res.data.secure_url;
    } catch (err) { setIsUploading(false); return null; }
  };

  const handleProfileUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      try {
        await axios.put(`${API_URL}/users/${currentUser._id}/update-pic`, { userId: currentUser._id, profilePic: url });
        const updatedUser = { ...currentUser, profilePic: url };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.location.reload();
      } catch (err) {}
    }
  };

  const handleFollow = async () => {
    try {
      if(followed) { await axios.put(`${API_URL}/users/${user._id}/unfollow`, { userId: currentUser._id }); setFollowed(false); } 
      else { await axios.put(`${API_URL}/users/${user._id}/follow`, { userId: currentUser._id }); setFollowed(true); }
      window.location.reload();
    } catch (err) {}
  };

  const isMyProfile = username === currentUser.username;

  return (
    <div className="profile-container">
      <button className="back-btn-profile" onClick={() => window.location.href = "/"}>⬅ Volver</button>
      
      <div className="profile-header">
        <div className="profile-pic-container">
          <div style={{position: "relative"}}>
            <img className="profile-user-img" src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" onClick={() => isMyProfile && profileInputRef.current.click()} style={{cursor: isMyProfile ? "pointer" : "default", opacity: isUploading ? 0.5 : 1}} title={isMyProfile ? "Clic para cambiar foto" : ""} />
            {isUploading && <span style={{position:"absolute", top:"40%", left:"20%", fontWeight:"bold"}}>Subiendo...</span>}
            {isMyProfile && <input type="file" ref={profileInputRef} style={{display: "none"}} onChange={handleProfileUpdate} accept="image/*" />}
          </div>
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-username">{user.username}</h2>
            {!isMyProfile && <button className={`profile-follow-btn ${followed ? "following" : ""}`} onClick={handleFollow}>{followed ? "Siguiendo" : "Seguir"}</button>}
            {isMyProfile && <button className="profile-edit-btn" onClick={() => profileInputRef.current.click()}>✏️ Editar Foto</button>}
          </div>
          <div className="profile-stats"><span><b>{posts.length}</b> pubs</span><span><b>{user.followers?.length}</b> seguidores</span><span><b>{user.followings?.length}</b> seguidos</span></div>
        </div>
      </div>

      <hr className="profile-divider"/>

      {/* GRID DE FOTOS */}
      <div className="profile-grid">
        {posts.map((p) => (
          <div key={p._id} className="grid-item" onClick={() => setSelectedPost(p)}> {/* AL CLIC, ABRIMOS EL MODAL */}
            <img src={p.img} alt="" className="grid-img" />
            <div className="grid-overlay"><span>❤️ {p.likes.length}</span><span>💬 {p.comments.length}</span></div>
          </div>
        ))}
      </div>

      {/* === MODAL (POP-UP) DE FOTO === */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-img-container">
                <img src={selectedPost.img} alt="" className="modal-img" />
            </div>
            <div className="modal-info">
                <div className="modal-header">
                    <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", borderRadius:"50%", marginRight:"10px"}} />
                    <b>{user.username}</b>
                </div>
                <div className="modal-desc">
                    <p>{selectedPost.desc}</p>
                </div>
                <div className="modal-stats">
                    <span>❤️ {selectedPost.likes.length} Me gusta</span>
                    <span style={{marginLeft:"15px"}}>💬 {selectedPost.comments.length} Comentarios</span>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedPost(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}