import React, { useState, useEffect } from "react";
import axios from "axios";
import Post from "./Post";
import "./Home.css";

const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // NOTIFICACIONES
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiPanel, setShowNotiPanel] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user.followings) user.followings = [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await axios.get(`${API_URL}/posts/timeline/all`);
        setPosts(postsRes.data);
        const usersRes = await axios.get(`${API_URL}/users/all/everybody`);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
        
        // NOTIFICACIONES
        const notiRes = await axios.get(`${API_URL}/notifications/${user._id}`);
        setNotifications(notiRes.data);
        setUnreadCount(notiRes.data.filter(n => !n.isRead).length);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [user._id]);

  const handleNotiClick = async () => {
    if (!showNotiPanel && unreadCount > 0) {
      try { await axios.put(`${API_URL}/notifications/read/${user._id}`); setUnreadCount(0); } catch(err) {}
    }
    setShowNotiPanel(!showNotiPanel);
  };

  const handleSearch = async (e) => { const query = e.target.value; setSearchQuery(query); if (query.length > 0) { try { const res = await axios.get(`${API_URL}/users/search/${query}`); setSearchResults(res.data); } catch (err) {} } else { setSearchResults([]); } };
  const goToProfile = (username) => { window.location.href = `/profile/${username}`; };
  const changeProfilePic = async () => { const url = prompt("URL foto:"); if (!url) return; try { await axios.put(`${API_URL}/users/${user._id}/update-pic`, { userId: user._id, profilePic: url }); const updatedUser = { ...user, profilePic: url }; localStorage.setItem("user", JSON.stringify(updatedUser)); window.location.reload(); } catch (err) {} };
  
  const handleFollow = async (userIdToFollow) => { 
    const isFollowing = user.followings.includes(userIdToFollow); 
    try { 
      if (isFollowing) { 
        await axios.put(`${API_URL}/users/${userIdToFollow}/unfollow`, { userId: user._id }); 
        user.followings = user.followings.filter(id => id !== userIdToFollow); 
      } else { 
        await axios.put(`${API_URL}/users/${userIdToFollow}/follow`, { userId: user._id }); 
        user.followings.push(userIdToFollow); 
      } 
      localStorage.setItem("user", JSON.stringify(user)); 
      window.location.reload(); 
    } catch (err) {} 
  };

  const handleSubmit = async (e) => { e.preventDefault(); const newPost = { userId: user._id, username: user.username, desc, img }; try { await axios.post(`${API_URL}/posts`, newPost); window.location.reload(); } catch (err) {} };
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
                    <div style={{display:"flex", alignItems:"center", gap:"10px"}}><img src={u.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", height:"30px", borderRadius:"50%"}}/><span style={{fontWeight: "bold"}}>{u.username}</span></div>
                    {u._id !== user._id && <button className={`mini-follow-btn ${isFollowing ? "following-mode" : ""}`} onClick={(e) => { e.stopPropagation(); handleFollow(u._id); }}>{isFollowing ? "Siguiendo" : "Seguir"}</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="notification-container" style={{position: "relative"}}>
            <span onClick={handleNotiClick} style={{fontSize: "24px", cursor: "pointer"}}>🔔</span>
            {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
            {showNotiPanel && (
              <div className="noti-dropdown">
                {notifications.length === 0 ? <p style={{padding:"10px", fontSize:"12px"}}>Sin notificaciones</p> : notifications.map(n => (
                  <div key={n._id} className="noti-item">
                    <strong>{n.senderName}</strong> {n.type === 'like' && "❤️ tu foto"}{n.type === 'comment' && "💬 comentó"}{n.type === 'follow' && "🤝 te sigue"}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => window.location.href = "/chat"} className="chat-btn">💬</button>
          <div onClick={changeProfilePic} style={{cursor: "pointer", display:"flex", alignItems:"center", gap:"5px"}}><img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover"}}/><span style={{ fontWeight: "bold" }}>{user.username}</span></div>
          <button onClick={handleLogout} className="logout-btn">Salir</button>
        </div>
      </div>
      <div className="main-content">
        <div className="feed-container">
          <div className="share-box">
            <div className="share-top"><img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="profile-img" /><input placeholder={`¿Qué piensas?`} className="share-input" onChange={(e) => setDesc(e.target.value)} /></div>
            <div className="share-bottom"><input placeholder="Link de imagen..." className="url-input" onChange={(e) => setImg(e.target.value)} /><button className="share-btn" onClick={handleSubmit}>Publicar</button></div>
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