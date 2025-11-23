import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Enviamos los datos al servidor
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      
      // 2. Mensaje de éxito
      alert("¡Bienvenido de nuevo! 🔓");
      console.log(res.data);
      
      // 3. Guardamos al usuario en la memoria del navegador
      localStorage.setItem("user", JSON.stringify(res.data));

      // 4. ¡IMPORTANTE! Recargamos la página para que App.js detecte el usuario y te mande al Home
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
      </div>
    </div>
  );
}