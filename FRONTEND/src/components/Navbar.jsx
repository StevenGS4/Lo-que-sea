import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Avatar,
  Popover,
  List,
  StandardListItem
} from "@ui5/webcomponents-react";

import "@ui5/webcomponents/dist/Avatar.js";
import "@ui5/webcomponents/dist/Icon.js";
import "@ui5/webcomponents/dist/Popover.js";
import "@ui5/webcomponents/dist/List.js";
import "@ui5/webcomponents/dist/StandardListItem.js";

import "../styles/navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const popoverRef = useRef();

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedUser");
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
  }, []);

  const cambiarTema = () => {
    const nuevo = theme === "light" ? "dark" : "light";
    setTheme(nuevo);
    localStorage.setItem("theme", nuevo);
    document.body.setAttribute("data-theme", nuevo);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("loggedUser");
    window.location.href = "/login-error";
  };

  if (!user) return null;

  return (
    <>
      <header className="nav-wrapper">
        <div className="nav-left">
          <h2 className="nav-title">Error Manager</h2>
          <span className="nav-user-name">{user.USERNAME}</span>
        </div>

        <div className="nav-right">
          <Button
            icon="home"
            design="Transparent"
            className="nav-icon-btn"
            onClick={() => (window.location.href = "/errors")}
          />

          <img
            src={`https://i.pravatar.cc/150?u=${user.USERID}`}
            alt="avatar"
            className="nav-avatar"
            onClick={(e) => popoverRef.current.showAt(e.target)}
          />
        </div>
      </header>

      <Popover ref={popoverRef} placement="BottomEnd" className="nav-popover">
        <List separators="Inner">
          <StandardListItem icon="employee" type="Inactive">
            {user.USERNAME} ({user.USERID})
          </StandardListItem>

          <StandardListItem icon="settings" onClick={() => alert("Config…")}>
            Configuración
          </StandardListItem>

          <StandardListItem
            icon={theme === "light" ? "moon" : "lightbulb"}
            onClick={cambiarTema}
          >
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </StandardListItem>

          <StandardListItem icon="log-out" onClick={cerrarSesion}>
            Cerrar sesión
          </StandardListItem>
        </List>
      </Popover>
    </>
  );
}
