import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  BusyIndicator,
  Text
} from "@ui5/webcomponents-react";

import axios from "axios";
import { sendErrorToServer } from "../services/errorReporter";
import { sendNoti } from "../utils/sendNoti";

import "../styles/test.css";

export default function TestErrorPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ============================================================
  // 1) Cargar usuario logueado
  // ============================================================
  async function loadUser() {
    try {
      const res = await axios.get(
        "http://localhost:3333/api/users/ztusers/USRERROR02"
      );

      setUser(res.data);

      // Guardar usuario globalmente
      localStorage.setItem("loggedUser", JSON.stringify(res.data));

    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  // ============================================================
  // 2) Generar error con auto-asignación y notificación confiable
  // ============================================================
  const generarError = async () => {
    const err = new Error(
      "Error CRÍTICO: No se pudo actualizar el stock del producto durante la operación de sincronización."
    );

    let errorId = null;

    try {
      const res = await sendErrorToServer(err, {
        module: "PRODUCTOS",
        component: "ProductSyncService",
        function: "updateStockFromSAP",
        severity: "CRITICAL",
        code: "PROD-STOCK-500",
        source: "front/ProductSync.jsx",
        CREATED_BY_APP: user?.USERID || "UNKNOWN",
        process: "Sincronización de catálogo y niveles de inventario",
        environment: "DEV",
      });

      errorId = res?.rows?.[0]?._id;


      // 2) Obtener el error recién insertado desde EL BACKEND REAL (4002)
      // 2) Obtener el error recién insertado desde ErrorManager
      let savedError = null;
      try {
        savedError = (
          await axios.get(
            `http://localhost:3334/odata/v4/api/error/${errorId}`
          )
        ).data;

        console.log("🔥 savedError:", savedError);

      } catch (e) {
        console.warn("No pude obtener el error desde 3334 (ErrorManager):", e);
      }


      // 3) Intentar auto-asignación
      // 3) NUEVA AUTO-ASIGNACIÓN (directo al backend)
      // Auto-assign directo al backend
      try {
        console.log("⚙ Ejecutando auto-assign desde FRONT...");

        await axios.post("http://localhost:3334/api/error/assign", {
          errorId,
          module: "PRODUCTOS"
        });

        console.log("🟢 Auto-assign ejecutado correctamente");
      } catch (e) {
        console.error("❌ Error en auto-assign:", e);
      }



    } catch (e) {
      console.error("ERROR GENERAL EN generarError:", e);
    }

    // 4) 🔥🔥🔥 S I E M P R E  C O R R E  🔥🔥🔥
    sendNoti(
      err.message,
      errorId,
      "error",
      "PRODUCTOS"
    );
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loadingUser)
    return (
      <div className="test-loading">
        <BusyIndicator active size="Large" />
        <Text style={{ marginTop: "1rem", color: "#fff" }}>
          Cargando usuario…
        </Text>
      </div>
    );

  // ============================================================
  // UI PRINCIPAL
  // ============================================================
  return (
    <div className="test-wrapper">
      <Card className="test-card">

        <CardHeader
          titleText="Simulador de Errores"
          subtitleText="Ventana de prueba para generador de errores"
          avatar={
            <img
              src={`https://i.pravatar.cc/100?u=${user.USERID}`}
              alt={user.USERNAME}
              className="test-avatar"
            />
          }
        />

        <div className="test-user-info">
          <h2>{user.USERNAME}</h2>
          <p className="user-role">{user.ROLES?.[0]?.ROLEID}</p>

          <div className="user-data-box">
            <p><b>ID:</b> {user.USERID}</p>
            <p><b>Email:</b> {user.EMAIL}</p>
            <p><b>Alias:</b> {user.ALIAS}</p>
            <p><b>Extensión:</b> {user.EXTENSION}</p>
          </div>
        </div>

        <div className="test-action">
          <button className="btn-error" onClick={generarError}>
            🚨 Generar Error
          </button>
        </div>
      </Card>
    </div>
  );
}
