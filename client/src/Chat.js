import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

// URL DE RENDER
const API_URL = "https://insta-clon-api.onrender.com/api";

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef();

  // CARGAR AMIGOS (FILTRO: SOLO A LOS QUE SIGO)
  useEffect(() => {
    const getFriends = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/all/everybody`);
        
        // Si no tengo lista de seguidos, inicio vacía
        const myFollowings = user.followings || [];
        
        // Filtramos: Solo muestro usuarios cuyo ID esté en mi lista de followings
        const onlyFriends = res.data.filter((f) => myFollowings.includes(f._id));
        
        setFriends(onlyFriends);
      } catch (err) { console.log(err); }
    };
    getFriends();
  }, [user._id, user.followings]);

  // CARGAR MENSAJES
  useEffect(() => {
    const getMessages = async () => {
      if (currentChatUser) {
        try {
          const res = await axios.get(`${API_URL}/messages/${user._id}/${currentChatUser._id}`);
          setMessages(res.data);
        } catch (err) { console.log(err); }
      }
    };
    getMessages();
  }, [currentChatUser, user._id]);

  // ENVIAR
  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = {
      senderId: user._id,
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
          {friends.length === 0 && <p style={{padding:"10px", color:"gray"}}>No sigues a nadie aún. Ve al inicio y sigue a alguien para chatear.</p>}
          
          {friends.map((friend) => (
            <div key={friend._id} className="conversation" onClick={() => setCurrentChatUser(friend)}>
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
              <div className="chatBoxTop">
                <div className="chatHeader">Hablando con: <b>{currentChatUser.username}</b></div>
                {messages.map((m) => (
                  <div key={m._id} ref={scrollRef} className={m.senderId === user._id ? "message own" : "message"}>
                    <div className="messageTop">
                      <p className="messageText">{m.text}</p>
                    </div>
                    <div className="messageBottom">{new Date(m.createdAt).toLocaleTimeString()}</div>
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