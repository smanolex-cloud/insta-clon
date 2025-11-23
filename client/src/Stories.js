import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Stories.css";

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

// TUS DATOS CLOUDINARY
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);
  
  const [replyText, setReplyText] = useState("");
  
  // ESTADOS PARA LISTA DE VISTOS
  const [statsList, setStatsList] = useState([]);
  const [showStats, setShowStats] = useState(false);

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

  const openStory = async (story) => {
    setSelectedStory(story);
    setShowStats(false); 
    
    if (story.userId !== user._id) {
        try { await axios.put(`${API_URL}/stories/${story._id}/view`, { userId: user._id }); } catch (err) {}
    } else {
        // Si es mía, cargamos la lista de gente real
        fetchStoryStats(story);
    }
  };

  // --- FUNCIÓN PARA OBTENER NOMBRES Y FOTOS DE LOS VISTOS ---
  const fetchStoryStats = async (story) => {
    try {
        // Juntamos likes y views en una sola lista de IDs únicos
        const allIds = [...new Set([...story.views, ...story.likes])];
        
        if (allIds.length === 0) {
            setStatsList([]);
            return;
        }

        // Pedimos al servidor los datos de estos IDs
        const res = await axios.post(`${API_URL}/users/bulk`, { ids: allIds });
        const usersData = res.data;

        // Marcamos quién dio like
        const processedList = usersData.map(u => ({
            ...u,
            liked: story.likes.includes(u._id),
            viewed: story.views.includes(u._id)
        }));

        // Ordenamos: Likes arriba
        processedList.sort((a, b) => (b.liked === true) - (a.liked === true));

        setStatsList(processedList);
    } catch (err) { console.error(err); }
  };

  const handleLike = async () => {
    try {
        await axios.put(`${API_URL}/stories/${selectedStory._id}/like`, { userId: user._id });
        if (selectedStory.likes.includes(user._id)) {
            selectedStory.likes = selectedStory.likes.filter(id => id !== user._id);
        } else {
            selectedStory.likes.push(user._id);
        }
        setSelectedStory({...selectedStory});
    } catch (err) {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText) return;

    const message = {
        senderId: user._id,
        receiverId: selectedStory.userId,
        text: replyText,
        storyImg: selectedStory.img // <--- Enviamos la foto
    };

    try {
        await axios.post(`${API_URL}/messages`, message);
        alert("Respuesta enviada");
        setReplyText("");
        setSelectedStory(null);
    } catch (err) { alert("Error al enviar"); }
  };

  const uploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      await axios.post(`${API_URL}/stories`, { userId: user._id, img: res.data.secure_url });
      setIsUploading(false);
      window.location.reload();
    } catch (err) { setIsUploading(false); alert("Error subiendo historia"); }
  };

  const isMyStory = selectedStory?.userId === user._id;
  const isLiked = selectedStory?.likes.includes(user._id);

  return (
    <div className="stories-container">
      <div className="story-item" onClick={() => fileInputRef.current.click()}>
        <div className="story-circle my-story">
          <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          <span className="plus-icon">+</span>
        </div>
        <span className="story-username">Tu historia</span>
        <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={uploadStory} accept="image/*" />
        {isUploading && <span className="uploading-text">Subiendo...</span>}
      </div>

      {stories.map((s) => (
        <div key={s._id} className="story-item" onClick={() => openStory(s)}>
          <div className={`story-circle ${!s.views.includes(user._id) && s.userId !== user._id ? "has-story" : "seen-story"}`}>
            <img src={s.userPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          </div>
          <span className="story-username">{s.username}</span>
        </div>
      ))}

      {selectedStory && (
        <div className="story-modal" onClick={() => setSelectedStory(null)}>
          <div className="story-view-content" onClick={(e) => e.stopPropagation()}>
            <div className="story-header">
                <img src={selectedStory.userPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
                <span>{selectedStory.username}</span>
                <span style={{marginLeft:"auto", fontSize:"12px", color:"#ccc"}}>hace {Math.floor((new Date() - new Date(selectedStory.createdAt)) / (1000 * 60 * 60))}h</span>
            </div>

            <div className="story-body">
                <img src={selectedStory.img} className="story-full-img" alt="" />
            </div>

            <div className="story-footer">
                {isMyStory ? (
                    <div className="my-story-stats">
                        <div onClick={() => setShowStats(!showStats)} style={{cursor:"pointer", display:"flex", alignItems:"center", gap:"10px"}}>
                            <span>👁️ {selectedStory.views.length}</span>
                            <span>❤️ {selectedStory.likes.length}</span>
                            <span style={{fontSize:"12px", color:"#ccc"}}> ⬆️ Ver lista</span>
                        </div>
                    </div>
                ) : (
                    <div className="reply-container">
                        <form onSubmit={handleReply} style={{flex:1, display:"flex"}}>
                            <input type="text" placeholder="Responder historia..." className="story-reply-input" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                        </form>
                        <span onClick={handleLike} className={`story-heart ${isLiked ? "liked" : ""}`}>{isLiked ? "❤️" : "🤍"}</span>
                    </div>
                )}
            </div>

            {/* LISTA DESPLEGABLE DE VISTOS */}
            {isMyStory && showStats && (
                <div className="viewers-list-overlay">
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px", borderBottom:"1px solid #444", paddingBottom:"10px"}}>
                        <h4>Visto por ({statsList.length})</h4>
                        <span onClick={() => setShowStats(false)} style={{cursor:"pointer", fontSize:"20px"}}>×</span>
                    </div>
                    
                    <div className="viewers-grid">
                        {statsList.length === 0 ? <p style={{fontSize:"13px", color:"gray"}}>Nadie la ha visto aún.</p> : statsList.map(viewer => (
                            <div key={viewer._id} className="viewer-row">
                                <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                                    <img src={viewer.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="viewer-img" />
                                    <span className="viewer-name">{viewer.username}</span>
                                </div>
                                {viewer.liked && <span className="viewer-heart">❤️</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}