import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Post from "./Post";
import Stories from "./Stories"; 
import "./Home.css";

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

// TUS DATOS DE CLOUDINARY
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 
const DEFAULT_IMG = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [desc, setDesc] = useState("");
  const [imgUrl, setImgUrl] = useState(""); 
  const [isUploading, setIsUploading] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bellCount, setBellCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  
  // NUEVO ESTADO: MOSTRAR BUSCADOR EN MOVIL
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user.followings) user.followings = [];
  const profileInputRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await axios.get(`${API_URL}/posts/timeline/all`);
        setPosts(postsRes.data);
        const usersRes = await axios.get(`${API_URL}/users/all/everybody`);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
        const notiRes = await axios.get(`${API_URL}/notifications/${user._id}`);
        setNotifications(notiRes.data);
        setBellCount(notiRes.data.filter(n => !n.isRead && n.type !== 'message').length);
        setMsgCount(notiRes.data.filter(n => !n.isRead && n.type === 'message').length);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user._id]);

  const uploadImage = async (file) => {
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try { const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data); setIsUploading(false); return res.data.secure_url; } catch (err) { setIsUploading(false); return null; }
  };

  const handlePostFileChange = async (e) => { const file = e.target.files[0]; if (file) { const url = await uploadImage(file); if (url) setImgUrl(url); } };
  const handleProfileFileChange = async (e) => { const file = e.target.files[0]; if (file) { const url = await uploadImage(file); if (url) { try { await axios.put(`${API_URL}/users/${user._id}/update-pic`, { userId: user._id, profilePic: url }); const updatedUser = { ...user, profilePic: url }; localStorage.setItem("user", JSON.stringify(updatedUser)); window.location.reload(); } catch (err) {} } } };

  const handleNotiClick = async () => {
    if (!showNotiPanel && bellCount > 0) {
      try { await axios.put(`${API_URL}/notifications/read/${user._id}`, { exclude: "message" }); setBellCount(0); } catch(err) {}
    }
    setShowNotiPanel(!showNotiPanel);
  };

  const handleChatClick = async () => { if (msgCount > 0) { try { await axios.put(`${API_URL}/notifications/read/${user._id}`, { type: "message" }); } catch (err) {} } window.location.href = "/chat"; };
  
  const handleSearch = async (e) => { 
    const query = e.target.value; 
    setSearchQuery(query); 
    if (query.length > 0) { 
        try { const res = await axios.get(`${API_URL}/users/search/${query}`); setSearchResults(res.data); } catch (err) {} 
    } else { setSearchResults([]); } 
  };
  
  const goToProfile = (username) => { window.location.href = `/profile/${username}`; };
  const handleFollow = async (userIdToFollow) => { const isFollowing = user.followings.includes(userIdToFollow); try { if (isFollowing) { await axios.put(`${API_URL}/users/${userIdToFollow}/unfollow`, { userId: user._id }); user.followings = user.followings.filter(id => id !== userIdToFollow); } else { await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id }); user.followings.push(userIdToFollow); } localStorage.setItem("user", JSON.stringify(user)); window.location.reload(); } catch (err) {} };
  const handleSubmit = async (e) => { e.preventDefault(); if (!imgUrl && !desc) return; const newPost = { userId: user._id, username: user.username, desc, img: imgUrl }; try { await axios.post(`${API_URL}/posts`, newPost); window.location.reload(); } catch (err) {} };
  const handleDelete = async (postId) => { if (!window.confirm("¿Borrar?")) return; try { await axios.delete(`${API_URL}/posts/${postId}`, { data: { userId: user._id } }); window.location.reload(); } catch (err) {} };
  const handleLogout = () => { localStorage.removeItem("user"); window.location.reload(); };

  return (
    <div className="home-container">
      
      {/* PANEL DE BÚSQUEDA MÓVIL */}
      {showMobileSearch && (
        <div className="mobile-search-overlay">
            <div className="mobile-search-header">
                <input type="text" placeholder="🔍 Buscar..." className="mobile-search-input" value={searchQuery} onChange={handleSearch} autoFocus />
                <button className="mobile-search-close" onClick={() => setShowMobileSearch(false)}>Cancelar</button>
            </div>
            <div className="mobile-search-results">
                {searchResults.map(u => {
                    const isFollowing = user.followings.includes(u._id);
                    return (
                        <div key={u._id} className="search-item" onClick={() => goToProfile(u.username)}>
                            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                                <img src={u.profilePic || DEFAULT_IMG} alt="" style={{width:"35px", height:"35px", borderRadius:"50%", objectFit:"cover"}}/>
                                <span style={{fontWeight:"bold"}}>{u.username}</span>
                            </div>
                            {u._id !== user._id && <button className={`mini-follow-btn ${isFollowing ? "following-mode" : ""}`} onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}>{isFollowing ? "Siguiendo" : "Seguir"}</button>}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      <div className="navbar">
        <h2>InstaClon</h2>
        
        {/* BUSCADOR PC */}
        <div className="search-bar-container desktop-only" style={{position: "relative"}}>
          <input type="text" placeholder="🔍 Buscar..." className="search-input-nav" value={searchQuery} onChange={handleSearch} />
          {searchResults.length > 0 && (
            <div className="search-results">{searchResults.map(u => {const isFollowing = user.followings.includes(u._id); return (<div key={u._id} className="search-item" onClick={() => goToProfile(u.username)}><div style={{display:"flex", alignItems:"center", gap:"10px"}}><img src={u.profilePic || DEFAULT_IMG} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}/><span style={{fontWeight:"bold"}}>{u.username}</span></div>{u._id !== user._id && <button className={`mini-follow-btn ${isFollowing ? "following-mode" : ""}`} onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}>{isFollowing ? "Siguiendo" : "Seguir"}</button>}</div>)})}</div>
          )}
        </div>

        {/* ICONOS PC */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{position: "relative"}}>
            <span onClick={handleNotiClick} style={{fontSize: "24px", cursor: "pointer"}}>🔔</span>
            {bellCount > 0 && <span className="noti-badge">{bellCount}</span>}
          </div>
          <div style={{position: "relative"}}><button onClick={handleChatClick} className="chat-btn">💬</button>{msgCount > 0 && <span className="noti-badge-chat">{msgCount}</span>}</div>
          <div onClick={() => goToProfile(user.username)} style={{cursor: "pointer", display:"flex", alignItems:"center", gap:"10px"}}><img src={user.profilePic || DEFAULT_IMG} alt="" style={{width:"35px", height:"35px", borderRadius:"50%", objectFit:"cover", border: "1px solid #555"}}/><span style={{ fontWeight: "bold", color: "#fff" }}>{user.username}</span></div>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>

        {/* ICONO CHAT MÓVIL (Arriba derecha) */}
        <div className="mobile-only" style={{position:"relative"}}>
            <button onClick={handleChatClick} className="chat-btn">💬</button>
            {msgCount > 0 && <span className="noti-badge-chat" style={{top: "-5px", right: "-5px"}}>{msgCount}</span>}
        </div>
      </div>

      <div className="main-content">
        <div className="feed-container">
          <Stories /> 
          <div className="share-box">
            <div className="share-top"><img src={user.profilePic || DEFAULT_IMG} alt="" className="profile-img" /><input placeholder={`¿Qué piensas?`} className="share-input" onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="share-bottom" style={{flexDirection:"column", alignItems:"flex-start", gap:"10px"}}><div style={{display:"flex", justifyContent:"space-between", width:"100%", alignItems:"center"}}><label className="file-upload-btn">📷 Elegir Foto<input type="file" onChange={handlePostFileChange} accept="image/*" style={{display:"none"}} /></label><button className="share-btn" onClick={handleSubmit} disabled={isUploading}>{isUploading ? "Subiendo..." : "Publicar"}</button></div>{imgUrl && <div style={{position:"relative", width:"100%"}}><img src={imgUrl} alt="Preview" style={{width:"100%", maxHeight:"300px", objectFit:"contain", borderRadius:"5px", border:"1px solid #333"}} /></div>}</div>
          </div>
          {posts.map((p) => <Post key={p._id} post={p} user={user} handleDelete={handleDelete} />)}
        </div>
        <div className="rightbar">
          <h3>Sugerencias</h3>
          <ul className="user-list">{users.map((u) => { const isFollowing = user.followings.includes(u._id); return (<li key={u._id} className="user-item"><div style={{display:"flex", alignItems:"center", gap:"10px"}}><img src={u.profilePic || DEFAULT_IMG} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}} /><span style={{fontWeight: "bold", cursor: "pointer"}} onClick={() => goToProfile(u.username)}>{u.username}</span></div><button className={`follow-btn ${isFollowing ? "following-mode" : ""}`} onClick={() => handleFollow(u._id)}>{isFollowing ? "Siguiendo" : "Seguir"}</button></li>); })}</ul>
        </div>
      </div>

      {/* === PANEL DE NOTIFICACIONES GLOBAL (AHORA FUERA DEL NAVBAR) === */}
      {showNotiPanel && (
        <div className="noti-dropdown-global">
            <div style={{display:"flex", justifyContent:"space-between", padding:"10px", borderBottom:"1px solid #333", position: "sticky", top:0, background:"#1e1e1e"}}>
                <span style={{fontWeight:"bold"}}>Notificaciones</span>
                <span onClick={() => setShowNotiPanel(false)} style={{cursor:"pointer"}}>✖</span>
            </div>
            {notifications.filter(n => n.type !== 'message').length === 0 ? (
                <p style={{padding:"20px", color:"gray", textAlign:"center"}}>Sin actividad reciente</p>
            ) : (
                notifications.filter(n => n.type !== 'message').map(n => (
                <div key={n._id} className="noti-item">
                    <strong>{n.senderName}</strong> 
                    {n.type === 'like' && " ❤️ le dio me gusta"}
                    {n.type === 'comment' && " 💬 comentó"}
                    {n.type === 'follow' && " 🤝 te empezó a seguir"}
                    {n.type === 'commentLike' && " ❤️ le gustó tu comentario"}
                </div>
                ))
            )}
        </div>
      )}

      {/* BARRA INFERIOR MÓVIL */}
      <div className="mobile-navbar">
        <button className="mobile-nav-item" onClick={() => window.location.href="/"}>🏠</button>
        <button className="mobile-nav-item" onClick={() => setShowMobileSearch(true)}>🔍</button>
        <button className="mobile-nav-item add-btn-mobile" onClick={() => document.querySelector('.file-upload-btn input').click()}>➕</button>
        <div style={{position:"relative"}}>
            <button className="mobile-nav-item" onClick={handleNotiClick}>❤️</button>
            {bellCount > 0 && <span className="mobile-noti-badge">{bellCount}</span>}
        </div>
        <button className="mobile-nav-item" onClick={() => goToProfile(user.username)}><img src={user.profilePic || DEFAULT_IMG} className="mobile-profile-img" alt="Yo" /></button>
      </div>
    </div>
  );
}