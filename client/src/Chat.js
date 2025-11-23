import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chat.css";

const API_URL = "https://insta-clon-api.onrender.com/api";

export default function Chat() {
  const [friends, setFriends] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const localUser = JSON.parse(localStorage.getItem("user"));
  const scrollRef = useRef();

  useEffect(() => {
    const getFriends = async () => {
      try {
        const myProfileRes = await axios.get(`${API_URL}/users/${localUser._id}`);
        const myFreshFollowings = myProfileRes.data.followings || []; 
        const allUsersRes = await axios.get(`${API_URL}/users/all/everybody`);
        const onlyFriends = allUsersRes.data.filter((f) => myFreshFollowings.includes(f._id));
        setFriends(onlyFriends);
      } catch (err) {}
    };
    if (localUser) getFriends();
  }, [localUser._id]);

  useEffect(() => {
    const getMessages = async () => {
      if (currentChatUser) {
        try { const res = await axios.get(`${API_URL}/messages/${localUser._id}/${currentChatUser._id}`); setMessages(res.data); } catch (err) {}
      }
    };
    getMessages();
  }, [currentChatUser, localUser._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    const message = { senderId: localUser._id, receiverId: currentChatUser._id, text: newMessage };
    try { const res = await axios.post(`${API_URL}/messages`, message); setMessages([...messages, res.data]); setNewMessage(""); } catch (err) {}
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="messenger">
      <div className="chatMenu">
        <div className="chatMenuWrapper">
          <h3 style={{padding: "20px 10px", borderBottom: "1px solid #333", margin: 0, fontSize: "20px"}}>💬 Chats</h3>
          {friends.length === 0 ? <p style={{padding:"20px", color:"gray", textAlign:"center"}}>No sigues a nadie.</p> : friends.map((friend) => (
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
                      {/* AQUÍ SE MUESTRA LA FOTO DE LA HISTORIA SI EXISTE */}
                      {m.storyImg && (
                        <div style={{marginBottom:"5px"}}>
                            <img src={m.storyImg} alt="Story" style={{width:"70px", height:"110px", objectFit:"cover", borderRadius:"10px", border:"1px solid #555"}} />
                            <div style={{fontSize:"10px", color:"#aaa", textAlign: m.senderId === localUser._id ? "right" : "left"}}>Respondió a historia</div>
                        </div>
                      )}
                      <p className="messageText">{m.text}</p>
                    </div>
                    <div className="messageBottom">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                ))}
              </div>
              <div className="chatBoxBottom">
                <textarea className="chatMessageInput" placeholder="Escribe..." onChange={(e) => setNewMessage(e.target.value)} value={newMessage} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}></textarea>
                <button className="chatSubmitButton" onClick={handleSubmit}>➤</button>
              </div>
            </>
          ) : <div className="noConversationState"><span className="noConversationText">Elige un amigo</span></div>}
        </div>
      </div>
    </div>
  );
}