import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

// TU LINK DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api";

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const localUser = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef();

  // 1. CARGAR AMIGOS (LÓGICA BLINDADA)
  useEffect(() => {
    const getFriends = async () => {
      try {
        // PASO A: Pedir mis datos frescos a la base de datos (no usamamos memoria local)
        const myProfileRes = await axios.get(`${API_URL}/users/${localUser._id}`);
        
        // Aquí obtenemos la lista REAL de a quiénes sigo
        const myFreshFollowings = myProfileRes.data.followings || []; 

        // PASO B: Pedir la lista de todos los usuarios del mundo
        const allUsersRes = await axios.get(`${API_URL}/users/all/everybody`);
        
        // PASO C: Filtrar (Cruzar las listas)
        const onlyFriends = allUsersRes.data.filter((f) => myFreshFollowings.includes(f._id));
        
        setFriends(onlyFriends);
      } catch (err) {
        console.log("Error cargando amigos:", err);
      }
    };
    if (localUser) {
      getFriends();
    }
  }, [localUser._id]);

  // 2. CARGAR MENSAJES
  useEffect(() => {
    const getMessages = async () => {
      if (currentChatUser) {
        try {
          const res = await axios.get(`${API_URL}/messages/${localUser._id}/${currentChatUser._id}`);
          setMessages(res.data);
        } catch (err) { console.log(err); }
      }
    };
    getMessages();
  }, [currentChatUser, localUser._id]);

  // 3. ENVIAR MENSAJE
  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = {
      senderId: localUser._id,
      receiverId: currentChatUser._id,
      text: newMessage,
    };
    try {
      const res = await axios.post(`${API_URL}/messages`, message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messenger">
      <div className="chatMenu">
        <div className="chatMenuWrapper">
          <h3>💬 Mis Amigos</h3>
          {friends.length === 0 ? (
            <div style={{padding:"20px", color:"gray", textAlign:"center"}}>
              <p>No aparece nadie...</p>
              <p style={{fontSize:"12px"}}>Ve al inicio y sigue a alguien nuevo.</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend._id} className="conversation" onClick={() => setCurrentChatUser(friend)}>
                <img className="conversationImg" src={friend.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
                <span className="conversationName">{friend.username}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chatBox">
        <div className="chatBoxWrapper">
          {currentChatUser ? (
            <>
              <div className="chatBoxTop">
                <div className="chatHeader">
                  <img src={currentChatUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" style={{width:"30px", borderRadius:"50%", verticalAlign:"middle", marginRight:"10px"}}/>
                  Hablando con: <b>{currentChatUser.username}</b>
                </div>
                {messages.map((m) => (
                  <div key={m._id} ref={scrollRef} className={m.senderId === localUser._id ? "message own" : "message"}>
                    <div className="messageTop">
                      <p className="messageText">{m.text}</p>
                    </div>
                    <div className="messageBottom">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                ))}
              </div>
              <div className="chatBoxBottom">
                <textarea className="chatMessageInput" placeholder="Escribe algo..." onChange={(e) => setNewMessage(e.target.value)} value={newMessage}></textarea>
                <button className="chatSubmitButton" onClick={handleSubmit}>Enviar</button>
              </div>
            </>
          ) : (
            <span className="noConversationText">Elige un amigo para chatear.</span>
          )}
        </div>
      </div>
      <button className="back-btn" onClick={() => window.location.href = "/"}>⬅ Volver</button>
    </div>
  );
}