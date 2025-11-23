import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

// URL DE PRODUCCIÓN
const API_URL = "https://insta-clon-api.onrender.com/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      // Guardamos usuario y recargamos
      localStorage.setItem("user", JSON.stringify(res.data));
      window.location.reload();
      
    } catch (err) {
      console.error(err);
      alert("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="logo">InstaClon</h1>
        
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="login-btn">Iniciar Sesión</button>
        </form>

        {/* --- AQUÍ ESTÁ EL NUEVO BOTÓN DE REGISTRO --- */}
        <div className="login-separator">
          <span>¿No tienes una cuenta?</span>
          <button 
            className="register-redirect-btn" 
            onClick={() => window.location.href = "/register"}
          >
            Regístrate
          </button>
        </div>

      </div>
    </div>
  );
}