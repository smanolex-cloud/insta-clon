import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

const API_URL = "https://insta-clon-api.onrender.com/api";

// 👇 TUS DATOS CLOUDINARY 👇
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]); // Para el buscador
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const localUser = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef();
  const fileInputRef = useRef(); // Para el botón de clip

  // 1. CARGAR AMIGOS
  useEffect(() => {
    const getFriends = async () => {
      try {
        const myProfileRes = await axios.get(`${API_URL}/users/${localUser._id}`);
        const myFreshFollowings = myProfileRes.data.followings || []; 
        const allUsersRes = await axios.get(`${API_URL}/users/all/everybody`);
        const onlyFriends = allUsersRes.data.filter((f) => myFreshFollowings.includes(f._id));
        setFriends(onlyFriends);
        setFilteredFriends(onlyFriends); // Inicialmente mostramos todos
      } catch (err) {}
    };
    if (localUser) getFriends();
  }, [localUser._id]);

  // 2. FILTRAR AMIGOS (BUSCADOR)
  useEffect(() => {
    setFilteredFriends(
      friends.filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, friends]);

  // 3. CARGAR MENSAJES Y AUTO-REFRESCO (CADA 3 SEGUNDOS)
  useEffect(() => {
    let interval;
    const getMessages = async () => {
      if (currentChatUser) {
        try { 
            const res = await axios.get(`${API_URL}/messages/${localUser._id}/${currentChatUser._id}`); 
            setMessages(res.data); 
        } catch (err) {}
      }
    };
    
    // Cargar inmediatamente
    getMessages();

    // Configurar el auto-refresco si hay chat abierto
    if (currentChatUser) {
        interval = setInterval(getMessages, 3000); // 3000ms = 3 segundos
    }

    return () => clearInterval(interval); // Limpiar al salir
  }, [currentChatUser, localUser._id]);

  // 4. ENVIAR TEXTO
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    
    const message = { 
        senderId: localUser._id, 
        receiverId: currentChatUser._id, 
        text: newMessage 
    };
    
    // Enviar y actualizar lista localmente rápido
    try { 
        const res = await axios.post(`${API_URL}/messages`, message); 
        setMessages([...messages, res.data]); 
        setNewMessage(""); 
    } catch (err) {}
  };

  // 5. ENVIAR FOTO (CLOUDINARY)
  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setIsUploading(true);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
        const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
        const url = cloudRes.data.secure_url;

        // Enviar mensaje con imagen
        const message = {
            senderId: localUser._id,
            receiverId: currentChatUser._id,
            img: url // Campo de imagen
        };
        const res = await axios.post(`${API_URL}/messages`, message);
        setMessages([...messages, res.data]);
        setIsUploading(false);
    } catch (err) { 
        setIsUploading(false); 
        alert("Error enviando foto");
    }
  };

  // Scroll al fondo
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="messenger">
      <div className="chatMenu">
        <div className="chatMenuWrapper">
          <div style={{padding: "15px", borderBottom: "1px solid #333"}}>
            <input 
                type="text" 
                placeholder="🔍 Buscar contacto..." 
                className="chat-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredFriends.length === 0 ? <p style={{padding:"20px", color:"gray", textAlign:"center"}}>No encontrado.</p> : filteredFriends.map((friend) => (
            <div key={friend._id} className={`conversation ${currentChatUser?._id === friend._id ? 'active' : ''}`} onClick={() => setCurrentChatUser(friend)}>
              <img className="conversationImg" src={friend.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
              <span className="conversationName">{friend.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chatBox">
        <div className="chatBoxWrapper">
          {currentChatUser ? (
            <>
              <div className="chatHeader">
                <div style={{display:"flex", alignItems:"center"}}>
                    <img className="headerImg" src={currentChatUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
                    <span className="headerName">{currentChatUser.username}</span>
                </div>
                <button className="chat-back-btn" onClick={() => window.location.href = "/"}>⬅ Volver</button>
              </div>
              
              <div className="chatBoxTop">
                {messages.map((m) => (
                  <div key={m._id} ref={scrollRef} className={m.senderId === localUser._id ? "message own" : "message"}>
                    <div className="messageTop" style={{flexDirection:"column", alignItems: m.senderId === localUser._id ? "flex-end" : "flex-start"}}>
                      
                      {/* IMAGEN DE HISTORIA */}
                      {m.storyImg && (
                        <div style={{marginBottom:"5px", opacity: 0.8}}>
                            <img src={m.storyImg} alt="Story" style={{width:"60px", height:"90px", objectFit:"cover", borderRadius:"8px", border:"1px solid #555"}} />
                            <div style={{fontSize:"10px", color:"#aaa", textAlign: "right"}}>Respuesta a historia</div>
                        </div>
                      )}

                      {/* IMAGEN ENVIADA EN CHAT */}
                      {m.img && (
                          <img src={m.img} alt="Enviada" className="message-sent-img" />
                      )}

                      {/* TEXTO (Solo si existe) */}
                      {m.text && <p className="messageText">{m.text}</p>}
                    </div>
                    <div className="messageBottom">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                ))}
              </div>

              <div className="chatBoxBottom">
                {/* BOTÓN DE CLIP PARA FOTOS */}
                <div className="chat-attach-btn" onClick={() => fileInputRef.current.click()}>
                    📎
                    <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={handleImageSend} accept="image/*" />
                </div>

                <textarea className="chatMessageInput" placeholder={isUploading ? "Enviando foto..." : "Escribe un mensaje..."} onChange={(e) => setNewMessage(e.target.value)} value={newMessage} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}></textarea>
                <button className="chatSubmitButton" onClick={handleSubmit}>➤</button>
              </div>
            </>
          ) : <div className="noConversationState"><span className="noConversationText">Selecciona un chat</span></div>}
        </div>
      </div>
    </div>
  );
}