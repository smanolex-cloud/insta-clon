import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]); 
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  // CARGAR DATOS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await axios.get("https://insta-clon-api.onrender.com/api/posts/timeline/all");
        setPosts(postsRes.data);

        const usersRes = await axios.get("https://insta-clon-api.onrender.com/api/users/all/everybody");
        setUsers(usersRes.data.filter(u => u._id !== user._id)); 
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user._id]);

  // SEGUIR USUARIO
  const handleFollow = async (userIdToFollow) => {
    try {
      await axios.put(`https://insta-clon-api.onrender.com/api/users/${userIdToFollow}/follow`, {
        userId: user._id,
      });
      alert("¡Siguiendo! 🤝");
    } catch (err) {
      console.error(err);
      alert("Ya sigues a este usuario.");
    }
  };

  // SUBIR FOTO
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = { userId: user._id, username: user.username, desc, img };
    try {
      await axios.post("https://insta-clon-api.onrender.com/api/posts", newPost);
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  // BORRAR FOTO
  const handleDelete = async (postId) => {
    if (!window.confirm("¿Borrar foto?")) return;
    try {
      await axios.delete(`https://insta-clon-api.onrender.com/api/posts/${postId}`, { data: { userId: user._id } });
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.removeItem("user"); window.location.reload(); };

  return (
    <div className="home-container">
      {/* BARRA DE NAVEGACIÓN */}
      <div className="navbar">
        <h2>InstaClon</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          {/* BOTÓN NUEVO PARA IR AL CHAT */}
          <button 
            onClick={() => window.location.href = "/chat"} 
            style={{padding: "5px 10px", background: "teal", color: "white", border: "none", borderRadius: "5px", cursor: "pointer"}}
          >
            💬 Mensajes
          </button>

          <span style={{ fontWeight: "bold" }}>Hola, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </div>

      <div className="main-content">
        {/* FEED IZQUIERDO */}
        <div className="feed-container">
          <div className="share-box">
            <div className="share-top">
              <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="" className="profile-img" />
              <input placeholder={`¿Qué piensas, ${user.username}?`} className="share-input" onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="share-bottom">
              <input placeholder="Link de tu imagen..." className="url-input" onChange={(e) => setImg(e.target.value)} />
              <button className="share-btn" onClick={handleSubmit}>Publicar</button>
            </div>
          </div>

          {posts.map((p) => (
            <div className="post" key={p._id}>
              <div className="post-header">
                <span className="post-username">{p.username || "Desconocido"}</span>
                <span className="post-date">{new Date(p.createdAt).toDateString()}</span>
              </div>
              <div className="post-center">
                <span className="post-text">{p.desc}</span>
                <img className="post-img" src={p.img} alt="" />
              </div>
              <div className="post-bottom" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>❤️ Me gusta</span>
                {p.userId === user._id && <button onClick={() => handleDelete(p._id)} style={{border:"none", background:"transparent", cursor:"pointer"}}>🗑️</button>}
              </div>
            </div>
          ))}
        </div>

        {/* BARRA DERECHA (SUGERENCIAS) */}
        <div className="rightbar">
          <h3>A quién seguir</h3>
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