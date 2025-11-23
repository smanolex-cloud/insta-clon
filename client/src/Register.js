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
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });
      alert("¡Cuenta creada con éxito! 🎉");
      console.log(res.data); // Esto ayuda a ver si llegó la respuesta
    } catch (err) {
      console.error(err);
      alert("Error al registrarse. Revisa si el servidor (puerto 5000) está encendido.");
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