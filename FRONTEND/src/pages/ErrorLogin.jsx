import React, { useEffect, useState } from "react";
import {
  Button,
  BusyIndicator,
  Input,
  Text
} from "@ui5/webcomponents-react";

import axios from "axios";
import "../styles/errorLogin.css";

export default function ErrorLogin() {
  const [user, setUser] = useState(null);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("loggedUser");

    // Si hay usuario → modo autologin
    if (saved) {
      setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }

    // Si NO hay usuario → mostrar login manual
    setLoading(false);
  }, []);

  // ===============================
  // VALIDAR USUARIO MANUALMENTE
  // ===============================
  const validarUsuario = async () => {
    if (!manualId.trim()) {
      setErrorMsg("Ingrese el ID de usuario");
      return;
    }

    try {
      setValidating(true);
      const res = await axios.get(`http://localhost:3333/api/users/ztusers/${manualId}`);

      // Usuario encontrado
      localStorage.setItem("loggedUser", JSON.stringify(res.data));
      setUser(res.data);
      setErrorMsg("");

    } catch {
      setErrorMsg("Usuario no encontrado");
    } finally {
      setValidating(false);
    }
  };

  // ===============================
  // INICIAR SESIÓN
  // ===============================
  const iniciarSesion = () => {
    window.location.href = "/errors";
  };

  // Vista de carga
  if (loading)
    return (
      <div className="elogin-loading">
        <BusyIndicator active size="Large" />
        <Text style={{ marginTop: "10px", color: "#fff" }}>Cargando...</Text>
      </div>
    );

  // ===============================
  // SI NO HAY USUARIO MOSTRAR LOGIN MANUAL
  // ===============================
  if (!user)
    return (
      <div className="elogin-fullscreen">

        <div className="elogin-box">

          <h2 style={{ marginBottom: "6px" }}>Iniciar Sesión</h2>
          <p style={{ color: "#6e7a90", marginBottom: "1rem" }}>
            Introduce tu ID de usuario
          </p>

          <Input
            placeholder="Ej: GSTE"
            value={manualId}
            onInput={(e) => setManualId(e.target.value)}
            className="elogin-input"
          />

          {errorMsg && (
            <p style={{ color: "red", marginTop: "8px" }}>{errorMsg}</p>
          )}

          <Button
            design="Emphasized"
            className="elogin-button"
            onClick={validarUsuario}
            disabled={validating}
          >
            {validating ? "Validando..." : "Continuar"}
          </Button>

        </div>
      </div>
    );

  // ===============================
  // SI HAY USUARIO MOSTRAR CONFIRMACIÓN
  // ===============================
  return (
    <div className="elogin-fullscreen">
      <div className="elogin-box">

        <img
          src={`https://i.pravatar.cc/150?u=${user.USERID}`}
          className="elogin-avatar"
          alt="avatar"
        />

        <div className="elogin-title">
          <h2>Acceso a ErrorManager</h2>
          <p>Confirmar identidad</p>
        </div>

        <h1>{user.USERNAME}</h1>
        <span className="elogin-role">{user.ROLES?.[0]?.ROLEID}</span>

        <div className="elogin-data">
          <p><b>ID:</b> {user.USERID}</p>
          <p><b>Email:</b> {user.EMAIL}</p>
          <p><b>Alias:</b> {user.ALIAS}</p>
        </div>

        <Button
          design="Emphasized"
          className="elogin-button"
          onClick={iniciarSesion}
        >
          Iniciar sesión
        </Button>

      </div>
    </div>
  );
}
