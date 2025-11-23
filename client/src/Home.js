import React, { useState, useEffect } from "react";
import axios from "axios";
import Post from "./Post";
import "./Home.css";

// TU LINK DE RENDER (Asegúrate que sea el tuyo)
const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Home() {
  // --- ESTADOS ---
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Estado para crear publicación
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  
  // Estados del Buscador
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Estados de Notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiPanel, setShowNotiPanel] = useState(false);

  // Obtener usuario actual de la memoria
  const user = JSON.parse(localStorage.getItem("user"));
  // Aseguramos que la lista de seguidos exista para evitar errores
  if (!user.followings) user.followings = [];

  // --- CARGAR DATOS AL INICIAR ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Cargar Publicaciones (Feed)
        const postsRes = await axios.get(`${API_URL}/posts/timeline/all`);
        setPosts(postsRes.data);
        
        // 2. Cargar Usuarios (Sugerencias)
        const usersRes = await axios.get(`${API_URL}/users/all/everybody`);
        // Filtramos para no mostrarme a mí mismo
        setUsers(usersRes.data.filter(u => u._id !== user._id));
        
        // 3. Cargar Notificaciones
        const notiRes = await axios.get(`${API_URL}/notifications/${user._id}`);
        setNotifications(notiRes.data);
        
        // Contar cuántas no he leído
        const count = notiRes.data.filter(n => !n.isRead).length;
        setUnreadCount(count);

      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
      }
    };
    fetchData();
  }, [user._id]);

  // --- FUNCIONES DE NOTIFICACIONES ---
  const handleNotiClick = async () => {
    // Si hay notificaciones sin leer y abro el panel, las marco como leídas
    if (!showNotiPanel && unreadCount > 0) {
      try {
        await axios.put(`${API_URL}/notifications/read/${user._id}`);
        setUnreadCount(0);
      } catch(err) {
        console.error(err);
      }
    }
    // Abrir o cerrar el panel
    setShowNotiPanel(!showNotiPanel);
  };

  // --- FUNCIONES DEL BUSCADOR ---
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      try {
        const res = await axios.get(`${API_URL}/users/search/${query}`);
        setSearchResults(res.data);
      } catch (err) { 
        console.error(err); 
      }
    } else {
      setSearchResults([]);
    }
  };

  // --- FUNCIONES DE PERFIL Y USUARIO ---
  const goToProfile = (username) => {
    window.location.href = `/profile/${username}`;
  };

  const changeProfilePic = async () => {
    const url = prompt("Pega el URL de tu nueva foto de perfil:");
    if (!url) return;
    
    try {
      await axios.put(`${API_URL}/users/${user._id}/update-pic`, {
        userId: user._id,
        profilePic: url
      });
      
      // Actualizar la memoria local
      const updatedUser = { ...user, profilePic: url };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) { 
      alert("Error al actualizar foto"); 
    }
  };

  const handleFollow = async (userIdToFollow) => {
    const isFollowing = user.followings.includes(userIdToFollow);
    
    try {
      if (isFollowing) {
        // Dejar de Seguir
        await axios.put(`${API_URL}/users/${userIdToFollow}/unfollow`, { userId: user._id });
        // Quitar de la lista local
        user.followings = user.followings.filter(id => id !== userIdToFollow);
      } else {
        // Seguir
        await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id });
        // Agregar a la lista local
        user.followings.push(userIdToFollow);
      }
      
      // Guardar cambios
      localStorage.setItem("user", JSON.stringify(user));
      window.location.reload();
    } catch (err) { 
      alert("Hubo un error al seguir/dejar de seguir"); 
    }
  };

  // --- FUNCIONES DE PUBLICACIONES ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = {
      userId: user._id,
      username: user.username,
      desc: desc,
      img: img
    };
    
    try {
      await axios.post(`${API_URL}/posts`, newPost);
      window.location.reload();
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("¿Seguro que quieres borrar esta foto?")) return;
    
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, { 
        data: { userId: user._id } 
      });
      window.location.reload();
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  // --- RENDERIZADO (HTML) ---
  return (
    <div className="home-container">
      
      {/* BARRA DE NAVEGACIÓN */}
      <div className="navbar">
        <h2>InstaClon</h2>
        
        {/* Barra de Búsqueda */}
        <div className="search-bar-container" style={{position: "relative"}}>
          <input 
            type="text" 
            placeholder="🔍 Buscar usuarios..." 
            className="search-input-nav" 
            value={searchQuery} 
            onChange={handleSearch} 
          />
          
          {/* Resultados de Búsqueda */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(u => {
                const isFollowing = user.followings.includes(u._id);
                return (
                  <div key={u._id} className="search-item" onClick={() => goToProfile(u.username)}>
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                      <img src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}/>
                      <span style={{fontWeight: "bold"}}>{u.username}</span>
                    </div>
                    
                    {/* Botón Seguir en Buscador */}
                    {u._id !== user._id && (
                      <button 
                        className={`mini-follow-btn ${isFollowing ? "following-mode" : ""}`} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleFollow(u._id); 
                        }}
                      >
                        {isFollowing ? "Siguiendo" : "Seguir"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Iconos de la derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          
          {/* CAMPANA DE NOTIFICACIONES */}
          <div className="notification-container" style={{position: "relative"}}>
            <span onClick={handleNotiClick} style={{fontSize: "24px", cursor: "pointer"}}>🔔</span>
            
            {unreadCount > 0 && (
              <span className="noti-badge">{unreadCount}</span>
            )}
            
            {showNotiPanel && (
              <div className="noti-dropdown">
                {notifications.length === 0 ? (
                  <p style={{padding:"10px", fontSize:"12px", color:"gray", textAlign:"center"}}>Sin notificaciones</p> 
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className="noti-item">
                      <strong>{n.senderName}</strong> 
                      {n.type === 'like' && " ❤️ le dio me gusta"}
                      {n.type === 'comment' && " 💬 comentó tu foto"}
                      {n.type === 'follow' && " 🤝 te empezó a seguir"}
                      {n.type === 'message' && " 📩 te envió un mensaje"}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Botón Chat */}
          <button onClick={() => window.location.href = "/chat"} className="chat-btn">💬</button>
          
          {/* Foto de Perfil (Cambiar Foto) */}
          <div onClick={changeProfilePic} style={{cursor: "pointer", display:"flex", alignItems:"center", gap:"5px"}} title="Clic para cambiar foto">
            <img 
              src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
              alt="" 
              style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}
            />
            <span style={{ fontWeight: "bold" }}>{user.username}</span>
          </div>
          
          {/* Botón Salir */}
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content">
        
        {/* COLUMNA IZQUIERDA: FEED */}
        <div className="feed-container">
          <div className="share-box">
            <div className="share-top">
              <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="profile-img" />
              <input placeholder={`¿Qué piensas?`} className="share-input" onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="share-bottom">
              <input placeholder="Link de imagen..." className="url-input" onChange={(e) => setImg(e.target.value)} />
              <button className="share-btn" onClick={handleSubmit}>Publicar</button>
            </div>
          </div>
          
          {/* Lista de Posts */}
          {posts.map((p) => (
            <Post key={p._id} post={p} user={user} handleDelete={handleDelete} />
          ))}
        </div>
        
        {/* COLUMNA DERECHA: SUGERENCIAS */}
        <div className="rightbar">
          <h3>Sugerencias</h3>
          <ul className="user-list">
            {users.map((u) => {
              const isFollowing = user.followings.includes(u._id);
              return (
                <li key={u._id} className="user-item">
                  <span 
                    style={{fontWeight: "bold", cursor: "pointer"}} 
                    onClick={() => goToProfile(u.username)}
                  >
                    {u.username}
                  </span>
                  <button 
                    className={`follow-btn ${isFollowing ? "following-mode" : ""}`} 
                    onClick={() => handleFollow(u._id)}
                  >
                    {isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}