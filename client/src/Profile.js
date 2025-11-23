import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import "./Profile.css"; 

const API_URL = "https://insta-clon-api.onrender.com/api"; 

export default function Profile() {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [followed, setFollowed] = useState(false);
  const username = useParams().username;
  const currentUser = JSON.parse(localStorage.getItem("user"));

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

  const handleFollow = async () => {
    try {
      if(followed) {
         await axios.put(`${API_URL}/users/${user._id}/unfollow`, { userId: currentUser._id });
         setFollowed(false);
      } else {
         await axios.put(`${API_URL}/users/${user._id}/follow`, { userId: currentUser._id });
         setFollowed(true);
      }
      window.location.reload();
    } catch (err) {}
  };

  return (
    <div className="profile-container">
      <button className="back-btn-profile" onClick={() => window.location.href = "/"}>⬅ Volver</button>
      <div className="profile-header">
        <div className="profile-pic-container"><img className="profile-user-img" src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" /></div>
        <div className="profile-info">
          <div className="profile-name-row"><h2 className="profile-username">{user.username}</h2>{username !== currentUser.username && <button className={`profile-follow-btn ${followed ? "following" : ""}`} onClick={handleFollow}>{followed ? "Siguiendo" : "Seguir"}</button>}</div>
          <div className="profile-stats"><span><b>{posts.length}</b> pubs</span><span><b>{user.followers?.length}</b> seguidores</span><span><b>{user.followings?.length}</b> seguidos</span></div>
        </div>
      </div>
      <hr className="profile-divider"/>
      <div className="profile-grid">{posts.map((p) => (<div key={p._id} className="grid-item"><img src={p.img} alt="" className="grid-img" /><div className="grid-overlay"><span>❤️ {p.likes.length}</span><span>💬 {p.comments.length}</span></div></div>))}</div>
    </div>
  );
}