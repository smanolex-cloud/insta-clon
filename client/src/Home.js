import React, { useState, useEffect } from "react";
import axios from "axios";
import Post from "./Post";
import "./Home.css";

// URL DE RENDER PARA PRODUCCIÓN
const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  
  // ESTADOS NUEVOS
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await axios.get(`${API_URL}/posts/timeline/all`);
        setPosts(postsRes.data);
        const usersRes = await axios.get(`${API_URL}/users/all/everybody`);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user._id]);

  // BUSCADOR
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      try {
        const res = await axios.get(`${API_URL}/users/search/${query}`);
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setSearchResults([]);
    }
  };

  // CAMBIAR FOTO DE PERFIL
  const changeProfilePic = async () => {
    const url = prompt("Pega el URL de tu nueva foto de perfil:");
    if (!url) return;
    
    try {
      await axios.put(`${API_URL}/users/${user._id}/update-pic`, {
        userId: user._id,
        profilePic: url
      });
      // Actualizamos la memoria local para ver el cambio al instante
      const updatedUser = { ...user, profilePic: url };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) { alert("Error al actualizar foto"); }
  };

  const handleFollow = async (userIdToFollow) => {
    try {
      await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id });
      alert("¡Siguiendo! 🤝");
      // Actualizamos el usuario local para que el chat sepa que ahora lo seguimos
      user.followings.push(userIdToFollow);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.reload();
    } catch (err) { alert("Ya sigues a este usuario."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = { userId: user._id, username: user.username, desc, img };
    try {
      await axios.post(`${API_URL}/posts`, newPost);
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("¿Borrar foto?")) return;
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, { data: { userId: user._id } });
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.removeItem("user"); window.location.reload(); };

  return (
    <div className="home-container">
      <div className="navbar">
        <h2>InstaClon</h2>
        
        {/* BARRA DE BÚSQUEDA */}
        <div className="search-bar-container" style={{position: "relative"}}>
          <input 
            type="text" 
            placeholder="🔍 Buscar usuarios..." 
            className="search-input-nav"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(u => (
                <div key={u._id} className="search-item">
                  <span>{u.username}</span>
                  {u._id !== user._id && (
                    <button className="mini-follow-btn" onClick={() => handleFollow(u._id)}>Seguir</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => window.location.href = "/chat"} className="chat-btn">💬</button>
          
          {/* FOTO DE PERFIL CLICKEABLE */}
          <div onClick={changeProfilePic} style={{cursor: "pointer", display:"flex", alignItems:"center", gap:"5px"}} title="Clic para cambiar foto">
            <img 
              src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
              alt="" 
              style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}
            />
            <span style={{ fontWeight: "bold" }}>{user.username}</span>
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
            <div className="share-bottom">
              <input placeholder="Link de tu imagen..." className="url-input" onChange={(e) => setImg(e.target.value)} />
              <button className="share-btn" onClick={handleSubmit}>Publicar</button>
            </div>
          </div>
          {posts.map((p) => (
            <Post key={p._id} post={p} user={user} handleDelete={handleDelete} />
          ))}
        </div>
        <div className="rightbar">
          <h3>Sugerencias</h3>
          <ul className="user-list">
            {users.map((u) => (
              <li key={u._id} className="user-item">
                <span style={{fontWeight: "bold"}}>{u.username}</span>
                <button className="follow-btn" onClick={() => handleFollow(u._id)}>Seguir</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}