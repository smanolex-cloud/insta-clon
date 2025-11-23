import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Stories.css";

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api"; 

// 👇 TUS DATOS 👇
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para interacción
  const [replyText, setReplyText] = useState("");
  const [viewersList, setViewersList] = useState([]); // Para ver quienes vieron mi historia
  const [showViewers, setShowViewers] = useState(false); // Toggle lista de vistos

  const user = JSON.parse(localStorage.getItem("user"));
  const fileInputRef = useRef();

  // Cargar historias
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${API_URL}/stories/all`);
        setStories(res.data);
      } catch (err) {}
    };
    fetchStories();
  }, []);

  // --- ABRIR HISTORIA Y MARCAR VISTO ---
  const openStory = async (story) => {
    setSelectedStory(story);
    setShowViewers(false); // Resetear vista de espectadores
    
    // Si la historia NO es mía, marco que la vi
    if (story.userId !== user._id) {
        try {
            await axios.put(`${API_URL}/stories/${story._id}/view`, { userId: user._id });
        } catch (err) {}
    } else {
        // Si ES mía, preparo la lista de espectadores para mostrarla
        // (Aquí hacemos un truco: obtenemos los usuarios completos basados en los IDs guardados en views)
        // Nota: Para hacerlo perfecto necesitaríamos un endpoint que traiga usuarios por array de IDs, 
        // pero por ahora mostraremos solo la cantidad o IDs si es simple.
        setViewersList(story.views); 
    }
  };

  // --- DAR LIKE A HISTORIA ---
  const handleLike = async () => {
    try {
        await axios.put(`${API_URL}/stories/${selectedStory._id}/like`, { userId: user._id });
        // Actualizar localmente para ver el cambio de color
        if (selectedStory.likes.includes(user._id)) {
            selectedStory.likes = selectedStory.likes.filter(id => id !== user._id);
        } else {
            selectedStory.likes.push(user._id);
        }
        setSelectedStory({...selectedStory}); // Forzar re-render
    } catch (err) {}
  };

  // --- RESPONDER HISTORIA (ENVIAR MENSAJE) ---
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText) return;

    const message = {
        senderId: user._id,
        receiverId: selectedStory.userId,
        text: `Respondió a tu historia: ${replyText}` // Texto especial
    };

    try {
        await axios.post(`${API_URL}/messages`, message);
        alert("Respuesta enviada");
        setReplyText("");
        setSelectedStory(null); // Cerrar historia
    } catch (err) { alert("Error al enviar"); }
  };

  // --- SUBIR HISTORIA ---
  const uploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
      await axios.post(`${API_URL}/stories`, {
        userId: user._id,
        img: res.data.secure_url
      });
      setIsUploading(false);
      window.location.reload();
    } catch (err) {
      setIsUploading(false);
      alert("Error subiendo historia");
    }
  };

  const isMyStory = selectedStory?.userId === user._id;
  const isLiked = selectedStory?.likes.includes(user._id);

  return (
    <div className="stories-container">
      {/* MI HISTORIA */}
      <div className="story-item" onClick={() => fileInputRef.current.click()}>
        <div className="story-circle my-story">
          <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          <span className="plus-icon">+</span>
        </div>
        <span className="story-username">Tu historia</span>
        <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={uploadStory} accept="image/*" />
        {isUploading && <span className="uploading-text">Subiendo...</span>}
      </div>

      {/* LISTA DE OTRAS HISTORIAS */}
      {stories.map((s) => (
        <div key={s._id} className="story-item" onClick={() => openStory(s)}>
          <div className={`story-circle ${!s.views.includes(user._id) && s.userId !== user._id ? "has-story" : "seen-story"}`}>
            <img src={s.userPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
          </div>
          <span className="story-username">{s.username}</span>
        </div>
      ))}

      {/* === VISOR DE HISTORIA (MODAL COMPLEJO) === */}
      {selectedStory && (
        <div className="story-modal" onClick={() => setSelectedStory(null)}>
          <div className="story-view-content" onClick={(e) => e.stopPropagation()}>
            
            {/* CABECERA */}
            <div className="story-header">
                <img src={selectedStory.userPic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
                <span>{selectedStory.username}</span>
                <span style={{marginLeft:"auto", fontSize:"12px", color:"#ccc"}}>hace {Math.floor((new Date() - new Date(selectedStory.createdAt)) / (1000 * 60 * 60))}h</span>
            </div>

            {/* IMAGEN PRINCIPAL */}
            <div className="story-body">
                <img src={selectedStory.img} className="story-full-img" alt="" />
            </div>

            {/* === PIE DE PÁGINA (INTERACCIÓN) === */}
            <div className="story-footer">
                
                {/* CASO 1: ES MI HISTORIA -> Muestro estadísticas */}
                {isMyStory ? (
                    <div className="my-story-stats">
                        <div onClick={() => setShowViewers(!showViewers)} style={{cursor:"pointer"}}>
                            👁️ {selectedStory.views.length} Vistos
                        </div>
                        <div>
                            ❤️ {selectedStory.likes.length} Likes
                        </div>
                    </div>
                ) : (
                /* CASO 2: HISTORIA DE OTRO -> Responder y Like */
                    <div className="reply-container">
                        <form onSubmit={handleReply} style={{flex:1, display:"flex"}}>
                            <input 
                                type="text" 
                                placeholder="Enviar mensaje..." 
                                className="story-reply-input"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                        </form>
                        <span onClick={handleLike} className={`story-heart ${isLiked ? "liked" : ""}`}>
                            {isLiked ? "❤️" : "🤍"}
                        </span>
                    </div>
                )}
            </div>

            {/* LISTA DE ESPECTADORES (Solo para mí) */}
            {isMyStory && showViewers && (
                <div className="viewers-list-overlay">
                    <h4>Visto por ({viewersList.length})</h4>
                    <p style={{fontSize:"12px", color:"gray"}}>Usuarios que vieron tu historia:</p>
                    {/* Aquí mostramos solo IDs por simplicidad, en una app real traeríamos nombres */}
                    <div className="viewers-grid">
                        {viewersList.map(id => <div key={id} className="viewer-id">Usuario ID: ...{id.slice(-4)}</div>)}
                    </div>
                </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}