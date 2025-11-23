import React, { useState, useEffect } from "react";
import axios from "axios";
import Post from "./Post"; 
import "./Home.css";

// 👇👇👇 PEGA TU LINK DE RENDER AQUÍ 👇👇👇
const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]); 
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");

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

  const handleFollow = async (userIdToFollow) => {
    try {
      await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id });
      alert("¡Siguiendo! 🤝");
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => window.location.href = "/chat"} className="chat-btn">💬 Mensajes</button>
          <span style={{ fontWeight: "bold" }}>Hola, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </div>

      <div className="main-content">
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
            <Post key={p._id} post={p} user={user} handleDelete={handleDelete} />
          ))}
        </div>
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