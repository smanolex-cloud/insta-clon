import React, { useState } from "react";
import axios from "axios";
import "./Register.css"; 

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // URL CORRECTA Y FINAL
      const res = await axios.post("https://insta-clon-api.onrender.com/api/auth/register", {
        username,
        email,
        password,
      });
      
      // LÓGICA DE ÉXITO FINAL: Guarda sesión y recarga.
      alert("¡Cuenta creada con éxito! 🎉 Iniciando sesión...");
      localStorage.setItem("user", JSON.stringify(res.data)); 
      window.location.reload(); 
      
    } catch (err) {
      console.error(err);
      // MENSAJE DE ERROR CORREGIDO: Ya no menciona el puerto 5000
      alert("Error al registrarse. Intenta de nuevo."); 
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="logo">InstaClon</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre de usuario"
            className="input-field"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            className="input-field"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="input-field"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="register-btn">Registrarte</button>
        </form>
      </div>
    </div>
  );
}