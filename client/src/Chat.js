import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Picker from "emoji-picker-react"; 
import "./Chat.css";

const API_URL = "https://insta-clon-api.onrender.com/api";
const CLOUD_NAME = "dbf9mqzcv"; 
const UPLOAD_PRESET = "insta_clon"; 

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const localUser = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef();
  const fileInputRef = useRef();

  // 1. CARGAR AMIGOS
  useEffect(() => {
    const getFriends = async () => {
      try {
        const myProfileRes = await axios.get(`${API_URL}/users/${localUser._id}`);
        const myFreshFollowings = myProfileRes.data.followings || []; 
        const allUsersRes = await axios.get(`${API_URL}/users/all/everybody`);
        const onlyFriends = allUsersRes.data.filter((f) => myFreshFollowings.includes(f._id));
        setFriends(onlyFriends);
        setFilteredFriends(onlyFriends);
      } catch (err) {}
    };
    if (localUser) getFriends();
  }, [localUser._id]);

  // 2. FILTRAR
  useEffect(() => {
    setFilteredFriends(friends.filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, friends]);

  // 3. CARGAR MENSAJES
  useEffect(() => {
    let interval;
    const getMessages = async () => {
      if (currentChatUser) {
        try { const res = await axios.get(`${API_URL}/messages/${localUser._id}/${currentChatUser._id}`); setMessages(res.data); } catch (err) {}
      }
    };
    getMessages();
    if (currentChatUser) interval = setInterval(getMessages, 3000);
    return () => clearInterval(interval);
  }, [currentChatUser, localUser._id]);

  // 4. ENVIAR TEXTO
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    const message = { senderId: localUser._id, receiverId: currentChatUser._id, text: newMessage };
    try { const res = await axios.post(`${API_URL}/messages`, message); setMessages([...messages, res.data]); setNewMessage(""); setShowPicker(false); } catch (err) {}
  };

  // 5. ENVIAR FOTO
  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try {
        const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, data);
        const message = { senderId: localUser._id, receiverId: currentChatUser._id, img: cloudRes.data.secure_url };
        const res = await axios.post(`${API_URL}/messages`, message);
        setMessages([...messages, res.data]);
        setIsUploading(false);
    } catch (err) { setIsUploading(false); }
  };

  const onEmojiClick = (emojiObject) => { setNewMessage(prev => prev + emojiObject.emoji); };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- NAVEGACIÓN INTELIGENTE ---
  const handleBack = () => {
    // Si estoy viendo un chat, el botón "Atrás" me lleva a la lista (solo afecta a móvil)
    if (currentChatUser) {
      setCurrentChatUser(null);
    } else {
      // Si estoy en la lista, el botón "Atrás" me lleva al Home
      window.location.href = "/";
    }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    // CLASE DINÁMICA: Si hay chat usuario seleccionado, activamos modo chat
    <div className={`messenger ${currentChatUser ? "chat-mode" : "list-mode"}`}>
      
      {/* --- MENU IZQUIERDO (LISTA) --- */}
      <div className="chatMenu">
        <div className="chatMenuWrapper">
          <div className="chatMenuHeader">
             <button className="menu-back-btn" onClick={() => window.location.href="/"}>⬅ Inicio</button>
             <span style={{fontWeight:"bold"}}>Chats</span>
             <div style={{width:"20px"}}></div> {/* Espacio para centrar */}
          </div>
          <div style={{padding: "10px"}}>
            <input type="text" placeholder="🔍 Buscar..." className="chat-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {filteredFriends.map((friend) => (
            <div key={friend._id} className={`conversation ${currentChatUser?._id === friend._id ? 'active' : ''}`} onClick={() => setCurrentChatUser(friend)}>
              <div style={{position:"relative"}}>
                <img className="conversationImg" src={friend.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
              </div>
              <span className="conversationName">{friend.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- CAJA DE CHAT (DERECHA) --- */}
      <div className="chatBox">
        <div className="chatBoxWrapper">
          {currentChatUser ? (
            <>
              <div className="chatHeader">
                <div style={{display:"flex", alignItems:"center"}}>
                    <button className="mobile-back-arrow" onClick={handleBack}>⬅</button>
                    <img className="headerImg" src={currentChatUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
                    <div>
                        <span className="headerName">{currentChatUser.username}</span>
                        <div style={{fontSize:"10px", color:"#aaa"}}>En el chat</div>
                    </div>
                </div>
                <button className="chat-info-btn">ℹ️</button>
              </div>
              
              <div className="chatBoxTop">
                {messages.map((m) => (
                  <div key={m._id} ref={scrollRef} className={m.senderId === localUser._id ? "message own" : "message"}>
                    <div className="messageTop" style={{flexDirection:"column", alignItems: m.senderId === localUser._id ? "flex-end" : "flex-start"}}>
                      {m.storyImg && <div className="story-reply-bubble"><img src={m.storyImg} alt="Story" /><span>Respondió a historia</span></div>}
                      {m.img && <img src={m.img} alt="Enviada" className="message-sent-img" />}
                      {m.text && <p className="messageText">{m.text}</p>}
                    </div>
                    <div className="messageBottom">{formatTime(m.createdAt)}</div>
                  </div>
                ))}
              </div>

              <div className="chatBoxBottom">
                {showPicker && <div className="emoji-picker-container"><Picker onEmojiClick={onEmojiClick} theme="dark" width={300} height={350} /></div>}
                
                <div className="input-pill-container">
                    <span className="chat-icon-btn" onClick={() => setShowPicker(!showPicker)}>😀</span>
                    <textarea className="chatMessageInput" placeholder="Mensaje..." onChange={(e) => setNewMessage(e.target.value)} value={newMessage} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}></textarea>
                    {isUploading ? <span style={{fontSize:"12px"}}>...</span> : <span className="chat-icon-btn" onClick={() => fileInputRef.current.click()}>📷</span>}
                    {newMessage.trim() ? <button className="chatSubmitButton" onClick={handleSubmit}>Enviar</button> : null}
                </div>
                <input type="file" ref={fileInputRef} style={{display:"none"}} onChange={handleImageSend} accept="image/*" />
              </div>
            </>
          ) : (
            /* ESTADO VACÍO (SOLO PC) */
            <div className="noConversationState">
                <span style={{fontSize:"50px"}}>✉️</span>
                <span className="noConversationText">Tus mensajes</span>
                <button className="send-msg-btn">Envía mensajes privados a tus amigos</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}