import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Stories.css";

const API_URL = "https://insta-clon-api.onrender.com/api"; 

// 👇 TUS DATOS DE CLOUDINARY AQUÍ 👇
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null); // Para verla en grande
  const [isUploading, setIsUploading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${API_URL}/stories/all`);
        setStories(res.data);
      } catch (err) {}
    };
    fetchStories();
  }, []);

  // SUBIR A CLOUDINARY
  const uploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      const url = res.data.secure_url;
      
      // Guardar en Backend
      await axios.post(`${API_URL}/stories`, {
        userId: user._id,
        img: url
      });
      setIsUploading(false);
      window.location.reload(); // Recargar para verla
    } catch (err) {
      setIsUploading(false);
      alert("Error subiendo historia");
    }
  };

  return (
    <div className="stories-container">
      {/* MI HISTORIA (BOTÓN +) */}
      <div className="story-item" onClick={() => fileInputRef.current.click()}>
        <div className="story-circle my-story">
          <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          <span className="plus-icon">+</span>
        </div>
        <span className="story-username">Tu historia</span>
        <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={uploadStory} accept="image/*" />
        {isUploading && <span className="uploading-text">Subiendo...</span>}
      </div>

      {/* LISTA DE HISTORIAS DE OTROS */}
      {stories.map((s) => (
        <div key={s._id} className="story-item" onClick={() => setSelectedStory(s)}>
          <div className="story-circle has-story">
            <img src={s.userPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          </div>
          <span className="story-username">{s.username}</span>
        </div>
      ))}

      {/* VISOR DE HISTORIA (MODAL) */}
      {selectedStory && (
        <div className="story-modal" onClick={() => setSelectedStory(null)}>
          <div className="story-view-content" onClick={(e) => e.stopPropagation()}>
            <div className="story-header">
                <img src={selectedStory.userPic} alt="" />
                <span>{selectedStory.username}</span>
                <span style={{marginLeft:"auto", fontSize:"12px", color:"gray"}}>hace {Math.floor((new Date() - new Date(selectedStory.createdAt)) / (1000 * 60 * 60))}h</span>
            </div>
            <img src={selectedStory.img} className="story-full-img" alt="" />
          </div>
        </div>
      )}
    </div>
  );
}