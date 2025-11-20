import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  ObjectStatus,
  Text,
  FlexBox,
  FlexBoxDirection,
} from "@ui5/webcomponents-react";

import "@ui5/webcomponents-icons/dist/employee.js";

const ErrorCard = ({ error }) => {

  const fecha = error.ERRORDATETIME
    ? new Date(error.ERRORDATETIME).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "Fecha desconocida";

  const statusState =
    error.STATUS === "RESOLVED"
      ? "Success"
      : error.STATUS === "IGNORED"
      ? "Warning"
      : "Error";

  const to = `/errors/${error._id || error.ERRORID}`;

  // 🔥 NUEVO VALOR: nombre del usuario que generó el error
  const user = error.CREATED_BY_APP || error.USER || error.GENERATEDBY || "Sin usuario";

  return (
    <div style={{ marginBottom: "1rem", position: "relative" }}>
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        <Card style={{ position: "relative" }}>

          {/* ⭐ ESTATUS EN LA ESQUINA SUPERIOR DERECHA */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "16px",
              zIndex: 10,
            }}
          >
            <ObjectStatus state={statusState} showDefaultIcon>
              {error.STATUS || "NEW"}
            </ObjectStatus>
          </div>

          <CardHeader
            titleText={`${error.ERRORCODE || "Sin código"} — ${
              error.ERRORSOURCE || "Origen desconocido"
            }`}
            subtitleText={`${user} — ${fecha}`}
            avatar={
              <img
                src={`https://i.pravatar.cc/50?u=${user}`}
                alt={user}
                className="error-avatar"
              />
            }
          />

          <FlexBox
            direction={FlexBoxDirection.Column}
            style={{
              padding: "1rem",
              backgroundColor: "#fff",
              borderRadius: "0 0 8px 8px",
            }}
          >
            {/* 🔹 MENSAJE DEL ERROR (lo tuyo, NO se toca) */}
            <Text style={{ lineHeight: "1.4" }}>
              {error.ERRORMESSAGE || "Sin descripción del error"}
            </Text>

            {/* 🔥🔥🔥 CAMPOS AGREGADOS (NO SE TOCÓ NADA, SOLO SE AGREGÓ) */}
            <Text style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#444" }}>
              <b>Tipo:</b> {error.TYPE_ERROR || "No especificado"}
            </Text>

            <Text style={{ fontSize: "0.85rem", color: "#444" }}>
              <b>Severidad:</b> {error.SEVERITY || "Sin severidad"}
            </Text>

            <Text style={{ fontSize: "0.85rem", color: "#444" }}>
              <b>Módulo:</b> {error.MODULE || "No definido"}
            </Text>

            <Text style={{ fontSize: "0.85rem", color: "#444" }}>
              <b>Aplicación:</b> {error.APPLICATION || "No especificada"}
            </Text>
            {/* 🔥🔥🔥 FIN DE AGREGADOS */}
          </FlexBox>
        </Card>
      </Link>
    </div>
  );
};

export default ErrorCard;
