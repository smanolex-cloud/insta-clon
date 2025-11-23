import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

export default function Chat() {
  const [friends, setFriends] = useState([]);      // Lista de usuarios para chatear
  const [currentChatUser, setCurrentChatUser] = useState(null); // Con quién hablo ahora
  const [messages, setMessages] = useState([]);    // Los mensajes
  const [newMessage, setNewMessage] = useState(""); // Lo que estoy escribiendo

  const user = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef(); // Para bajar el scroll automáticamente

  // 1. CARGAR LISTA DE USUARIOS (Tus amigos)
  useEffect(() => {
    const getFriends = async () => {
      try {
        const res = await axios.get("https://insta-clon-api.onrender.com/api/users/all/everybody");
        // Filtramos para no mostrarme a mí mismo en la lista
        setFriends(res.data.filter((f) => f._id !== user._id));
      } catch (err) {
        console.log(err);
      }
    };
    getFriends();
  }, [user._id]);

  // 2. CARGAR MENSAJES CUANDO ELIJO A ALGUIEN
  useEffect(() => {
    const getMessages = async () => {
      if (currentChatUser) {
        try {
          const res = await axios.get(
            `https://insta-clon-api.onrender.com/api/messages/${user._id}/${currentChatUser._id}`
          );
          setMessages(res.data);
        } catch (err) {
          console.log(err);
        }
      }
    };
    getMessages();
  }, [currentChatUser, user._id]);

  // 3. ENVIAR MENSAJE
  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = {
      senderId: user._id,
      receiverId: currentChatUser._id,
      text: newMessage,
    };

    try {
      const res = await axios.post("https://insta-clon-api.onrender.com/api/messages", message);
      setMessages([...messages, res.data]); // Agregamos el mensaje a la lista visualmente
      setNewMessage(""); // Limpiamos el input
    } catch (err) {
      console.log(err);
    }
  };

  // Autoscroll: Bajar al último mensaje siempre
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messenger">
      {/* MENU IZQUIERDO: AMIGOS */}
      <div className="chatMenu">
        <div className="chatMenuWrapper">
          <h3>💬 Tus Contactos</h3>
          {friends.map((friend) => (
            <div 
              key={friend._id} 
              className="conversation" 
              onClick={() => setCurrentChatUser(friend)}
            >
              <img className="conversationImg" src={friend.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" />
              <span className="conversationName">{friend.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CAJA DERECHA: EL CHAT */}
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
                <textarea
                  className="chatMessageInput"
                  placeholder="Escribe algo..."
                  onChange={(e) => setNewMessage(e.target.value)}
                  value={newMessage}
                ></textarea>
                <button className="chatSubmitButton" onClick={handleSubmit}>Enviar</button>
              </div>
            </>
          ) : (
            <span className="noConversationText">Haz clic en un usuario para empezar a chatear.</span>
          )}
        </div>
      </div>
      
      <button className="back-btn" onClick={() => window.location.href = "/"}>⬅ Volver al Muro</button>
    </div>
  );
}