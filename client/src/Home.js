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
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      setIsUploading(false);
      return res.data.secure_url; 
    } catch (err) {
      setIsUploading(false);
      alert("Error al subir imagen.");
      return null;
    }
  };

  const handlePostFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) setImgUrl(url);
    }
  };

  // CAMBIAR FOTO DE PERFIL
  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        try {
          await axios.put(`${API_URL}/users/${user._id}/update-pic`, { userId: user._id, profilePic: url });
          const updatedUser = { ...user, profilePic: url };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.location.reload();
        } catch (err) { alert("Error guardando perfil"); }
      }
    }
  };

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