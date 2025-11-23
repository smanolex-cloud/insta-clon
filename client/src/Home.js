import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Post from "./Post";
import "./Home.css";

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

// TUS DATOS DE CLOUDINARY (YA CONFIGURADOS)
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Estados para crear publicación
  const [desc, setDesc] = useState("");
  const [imgUrl, setImgUrl] = useState(""); // Guardamos la URL que nos da Cloudinary
  const [isUploading, setIsUploading] = useState(false); // Para bloquear el botón mientras sube

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Notificaciones
  const [notifications, setNotifications] = useState([]);
  const [bellCount, setBellCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [showNotiPanel, setShowNotiPanel] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user.followings) user.followings = [];

  // Referencia para el input oculto de perfil
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
        
        const unreadBell = notiRes.data.filter(n => !n.isRead && n.type !== 'message').length;
        setBellCount(unreadBell);

        const unreadMsg = notiRes.data.filter(n => !n.isRead && n.type === 'message').length;
        setMsgCount(unreadMsg);

      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user._id]);

  // --- FUNCIÓN MAESTRA PARA SUBIR IMAGEN A CLOUDINARY ---
  const uploadImage = async (file) => {
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      setIsUploading(false);
      return res.data.secure_url; // Retorna el link de internet de la foto
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("Error al subir imagen. Verifica tu conexión.");
      return null;
    }
  };

  // CAMBIAR FOTO DE PERFIL (DESDE ARCHIVO)
  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadImage(file); // Subir a nube
    if (url) {
      // Guardar en BD
      try {
        await axios.put(`${API_URL}/users/${user._id}/update-pic`, {
          userId: user._id,
          profilePic: url
        });
        const updatedUser = { ...user, profilePic: url };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.location.reload();
      } catch (err) { alert("Error guardando en perfil"); }
    }
  };

  // SELECCIONAR FOTO PARA PUBLICACIÓN
  const handlePostFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) setImgUrl(url);
    }
  };

  // NOTIFICACIONES
  const handleNotiClick = async () => {
    if (!showNotiPanel && bellCount > 0) {
      try { await axios.put(`${API_URL}/notifications/read/${user._id}`, { exclude: "message" }); setBellCount(0); } catch(err) {}
    }
    setShowNotiPanel(!showNotiPanel);
  };

  const handleChatClick = async () => {
    if (msgCount > 0) { try { await axios.put(`${API_URL}/notifications/read/${user._id}`, { type: "message" }); } catch (err) {} }
    window.location.href = "/chat";
  };

  const handleSearch = async (e) => { const query = e.target.value; setSearchQuery(query); if (query.length > 0) { try { const res = await axios.get(`${API_URL}/users/search/${query}`); setSearchResults(res.data); } catch (err) {} } else { setSearchResults([]); } };
  const goToProfile = (username) => { window.location.href = `/profile/${username}`; };
  
  const handleFollow = async (userIdToFollow) => {
    const isFollowing = user.followings.includes(userIdToFollow);
    try {
      if (isFollowing) { await axios.put(`${API_URL}/users/${userIdToFollow}/unfollow`, { userId: user._id }); user.followings = user.followings.filter(id => id !== userIdToFollow); }
      else { await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id }); user.followings.push(userIdToFollow); }
      localStorage.setItem("user", JSON.stringify(user)); window.location.reload();
    } catch (err) { alert("Error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imgUrl && !desc) return alert("Escribe algo o sube una foto");
    const newPost = { userId: user._id, username: user.username, desc, img: imgUrl };
    try { await axios.post(`${API_URL}/posts`, newPost); window.location.reload(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => { if (!window.confirm("¿Borrar?")) return; try { await axios.delete(`${API_URL}/posts/${postId}`, { data: { userId: user._id } }); window.location.reload(); } catch (err) {} };
  const handleLogout = () => { localStorage.removeItem("user"); window.location.reload(); };

  return (
    <div className="home-container">
      <div className="navbar">
        <h2>InstaClon</h2>
        <div className="search-bar-container" style={{position: "relative"}}>
          <input type="text" placeholder="🔍 Buscar..." className="search-input-nav" value={searchQuery} onChange={handleSearch} />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(u => {
                const isFollowing = user.followings.includes(u._id);
                return (
                  <div key={u._id} className="search-item" onClick={() => goToProfile(u.username)}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}><img src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}/><span>{u.username}</span></div>
                    {u._id !== user._id && <button className={`mini-follow-btn ${user.followings.includes(u._id) ? "following-mode" : ""}`} onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}>{user.followings.includes(u._id) ? "Siguiendo" : "Seguir"}</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="notification-container" style={{position: "relative"}}>
            <span onClick={handleNotiClick} style={{fontSize: "24px", cursor: "pointer"}}>🔔</span>
            {bellCount > 0 && <span className="noti-badge">{bellCount}</span>}
            {showNotiPanel && <div className="noti-dropdown">{notifications.filter(n => n.type !== 'message').length === 0 ? <p style={{padding:"10px", fontSize:"12px"}}>Sin actividad</p> : notifications.filter(n => n.type !== 'message').map(n => <div key={n._id} className="noti-item"><strong>{n.senderName}</strong> {n.type==='like' && "❤️ like"}{n.type==='follow' && "🤝 te sigue"}{n.type==='comment' && "💬 comentó"}</div>)}</div>}
          </div>
          
          <div className="chat-btn-container" style={{position: "relative"}}>
            <button onClick={handleChatClick} className="chat-btn">💬</button>
            {msgCount > 0 && <span className="noti-badge-chat">{msgCount}</span>}
          </div>

          {/* CLIC EN FOTO -> INPUT OCULTO */}
          <div onClick={() => profileInputRef.current.click()} style={{cursor: "pointer", display:"flex", alignItems:"center", gap:"5px"}} title="Cambiar foto">
            <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}/>
            <span style={{ fontWeight: "bold" }}>{user.username}</span>
            {/* Input invisible para foto de perfil */}
            <input type="file" ref={profileInputRef} style={{display:"none"}} onChange={handleProfileFileChange} accept="image/*" />
          </div>
          
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </div>

      <div className="main-content">
        <div className="feed-container">
          <div className="share-box">
            <div className="share-top">
              <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="profile-img" />
              <input placeholder={`¿Qué piensas?`} className="share-input" onChange={(e) => setDesc(e.target.value)} />
            </div>
            
            {/* ZONA DE SUBIDA DE POST */}
            <div className="share-bottom" style={{flexDirection:"column", alignItems:"flex-start", gap:"10px"}}>
              <div style={{display:"flex", justifyContent:"space-between", width:"100%", alignItems:"center"}}>
                <label className="file-upload-btn">
                  📷 Elegir Foto
                  <input type="file" onChange={handlePostFileChange} accept="image/*" style={{display:"none"}} />
                </label>
                <button className="share-btn" onClick={handleSubmit} disabled={isUploading}>
                  {isUploading ? "Cargando..." : "Publicar"}
                </button>
              </div>
              {/* VISTA PREVIA */}
              {imgUrl && <div style={{position:"relative", width:"100%"}}>
                <img src={imgUrl} alt="Preview" style={{width:"100%", maxHeight:"300px", objectFit:"contain", borderRadius:"5px", border:"1px solid #333"}} />
                <p style={{fontSize:"12px", color:"lightgreen"}}>¡Imagen lista para publicar!</p>
              </div>}
            </div>

          </div>
          {posts.map((p) => <Post key={p._id} post={p} user={user} handleDelete={handleDelete} />)}
        </div>
        <div className="rightbar">
          <h3>Sugerencias</h3>
          <ul className="user-list">
            {users.map((u) => {
              const isFollowing = user.followings.includes(u._id);
              return (
                <li key={u._id} className="user-item"><span style={{fontWeight: "bold", cursor: "pointer"}} onClick={() => goToProfile(u.username)}>{u.username}</span><button className={`follow-btn ${isFollowing ? "following-mode" : ""}`} onClick={() => handleFollow(u._id)}>{isFollowing ? "Siguiendo" : "Seguir"}</button></li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}