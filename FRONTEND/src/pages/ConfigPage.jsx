// src/pages/ConfigPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Title,
  Text,
  Input,
  Label,
  MessageStrip,
  TabContainer,
  Tab,
  BusyIndicator,
  FlexBox,
  FlexBoxDirection,
  Dialog,
} from "@ui5/webcomponents-react";

import axios from "axios";
import "../styles/configPage.css";

import "@ui5/webcomponents/dist/TabContainer.js";
import "@ui5/webcomponents/dist/Tab.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/settings.js";
import "@ui5/webcomponents-icons/dist/sys-monitor.js";
import "@ui5/webcomponents-icons/dist/refresh.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/status-inactive.js";
import "@ui5/webcomponents-icons/dist/status-positive.js";

const USERS_API_BASE = "http://localhost:3333/api/users/crud";

// ======================================================
// 🔹 Selector de Avatar (Galería + URL)
// ======================================================
// ======================================================
// 🔹 Helpers
// ======================================================
const isUserObject = (obj) => {
  if (!obj || typeof obj !== "object") return false;
  return !!obj.USERID;
};

const extractUsersFromNode = (node, acc = []) => {
  if (!node) return acc;

  if (Array.isArray(node)) {
    node.forEach((n) => extractUsersFromNode(n, acc));
    return acc;
  }
  if (typeof node === "object") {
    if (isUserObject(node)) acc.push(node);
    if (node.data) extractUsersFromNode(node.data, acc);
    if (node.dataRes) extractUsersFromNode(node.dataRes, acc);
    if (node.value) extractUsersFromNode(node.value, acc);
  }
  return acc;
};

const normalizeUser = (raw) => ({
  id: raw.USERID,
  USERID: raw.USERID,
  USERNAME: raw.USERNAME || "",
  EMAIL: raw.EMAIL || "",
  ALIAS: raw.ALIAS || "",
  // Para mostrar estado en UI usamos ACTIVED si viene, o ACTIVE, o true
  ACTIVED: raw.ACTIVED ?? raw.ACTIVE ?? true,
  raw,
});

// ======================================================
// 🔹 COMPONENTE PRINCIPAL
// ======================================================
export default function ConfigPage() {
  const [loggedUser, setLoggedUser] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [activeTab, setActiveTab] = useState("tab-profile");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);

  const [message, setMessage] = useState(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  // ======================================================
  // 🔹 Cargar usuario desde localStorage
  // ======================================================
  useEffect(() => {
    const saved = localStorage.getItem("loggedUser");
    if (!saved) return;

    try {
      const user = JSON.parse(saved);
      setLoggedUser(user);

      const savedAvatar = localStorage.getItem(`userAvatar_${user.USERID}`);
      const defaultAvatar = `https://i.pravatar.cc/150?u=${user.USERID}`;

      setProfileForm({
        ...user,
        AVATAR: savedAvatar || defaultAvatar,
      });
    } catch {
      // ignore
    }
  }, []);

  const showMessage = (type, text) => setMessage({ type, text });

  const mapMsgDesign = (t) =>
    t === "error"
      ? "Negative"
      : t === "success"
        ? "Positive"
        : "Information";

  // ======================================================
  // 🔹 Limpiar usuario: SOLO CAMPOS VÁLIDOS PARA updateOne
  // ======================================================
  const cleanUserForUpdate = (user) => {
    // ⚠️ Esta lista es la "whitelist" de campos permitidos
    const allowed = [
      "USERID",
      "USERNAME",
      "EMAIL",
      "ALIAS",
      "PHONENUMBER",
      "EXTENSION",
      "COMPANYID",
      "CEDIID",
      "EMPLOYEEID",
      "ACTIVE", // para activar/desactivar
    ];

    const clean = {};

    for (const key of allowed) {
      if (user[key] !== undefined) clean[key] = user[key];
    }

    return clean;
  };

  // ======================================================
  // 🚀 saveToServer compatible con SAP CAP (updateOne)
  // ======================================================
  const saveToServer = async (userToSave, loggedUserId) => {
    const cleanBody = cleanUserForUpdate(userToSave);

    const params = new URLSearchParams({
      ProcessType: "updateOne",
      DBServer: "MongoDB",
      LoggedUser: loggedUserId || "SYSTEM",
    });

    const url = `${USERS_API_BASE}?${params.toString()}`;

    console.log("📤 Enviando a backend (updateOne):", cleanBody);

    return axios.post(url, { usuario: cleanBody });
  };

  const handleProfileChange = (f) => (e) =>
    setProfileForm((p) => ({ ...p, [f]: e.target.value }));

  // ======================================================
  // 🔹 Guardar perfil (solo campos válidos)
  // ======================================================
  const handleProfileSave = async () => {
    if (!loggedUser) return;
    setSavingProfile(true);

    try {
      // Mezclamos lo que había en loggedUser con lo editado en profileForm
      const merged = {
        ...loggedUser,
        ...profileForm,
      };

      // El avatar es solo local, no va al backend
      delete merged.AVATAR;

      await saveToServer(merged, loggedUser.USERID);

      // Guardamos versión limpia en localStorage
      localStorage.setItem("loggedUser", JSON.stringify(merged));

      // Volvemos a poner el avatar para UI
      const avatar =
        profileForm.AVATAR ||
        localStorage.getItem(`userAvatar_${merged.USERID}`);

      setLoggedUser(merged);
      setProfileForm({ ...merged, AVATAR: avatar });

      showMessage("success", "Perfil actualizado correctamente");
    } catch (err) {
      console.error("❌ Error guardando perfil:", err);
      showMessage("error", "No se pudo guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  // ======================================================
  // 🔹 Fetch usuarios
  // ======================================================
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.post(
        `${USERS_API_BASE}?ProcessType=getAll&DBServer=MongoDB&LoggedUser=SYSTEM`,
        { usuario: {} }
      );

      const extracted = extractUsersFromNode(res.data, []);
      const uniq = new Map();

      extracted.forEach((u) => uniq.set(u.USERID, u));

      setUsers([...uniq.values()].map(normalizeUser));
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
      showMessage("error", "Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tab-users" && users.length === 0) fetchUsers();
  }, [activeTab, users.length]);

  // ======================================================
  // 🔹 Activar / desactivar usuario
  // ======================================================
  const handleToggleActive = async (u) => {
    setSavingUserId(u.USERID);

    try {
      // UI usa ACTIVED, pero al backend solo le mandamos ACTIVE
      const newActive = !u.ACTIVED;

      const updatedForBackend = {
        ...u.raw,
        ACTIVE: newActive,
      };

      await saveToServer(updatedForBackend, loggedUser.USERID);

      // Actualizamos lista en memoria
      setUsers((prev) =>
        prev.map((x) =>
          x.USERID === u.USERID
            ? { ...x, ACTIVED: newActive, raw: { ...x.raw, ACTIVE: newActive } }
            : x
        )
      );

      // Si es el usuario logueado, también actualizar localStorage
      if (loggedUser.USERID === u.USERID) {
        const newLogged = {
          ...loggedUser,
          ACTIVE: newActive,
        };
        localStorage.setItem("loggedUser", JSON.stringify(newLogged));
        setLoggedUser(newLogged);

        // conservar avatar actual
        setProfileForm((p) => ({
          ...newLogged,
          AVATAR: p.AVATAR,
        }));
      }

      showMessage("success", "Estado actualizado");
    } catch (err) {
      console.error("❌ Error actualizando estado:", err);
      showMessage("error", "No se pudo actualizar el estado");
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const validRoles = ["jefe.productos", "dev.productos"];

    let filtered = users.filter((u) => {
      // obtener roles reales
      const roles = u.raw?.ROLES || [];

      // si NO tiene roles válidos
      const hasValidRole = roles.some((r) => validRoles.includes(r.ROLEID));

      // si es el usuario actual y NO tiene rol válido → excluirlo
      if (u.USERID === loggedUser.USERID && !hasValidRole) {
        return false;
      }

      return hasValidRole;
    });

    // Filtro por búsqueda
    if (usersSearch.trim()) {
      const t = usersSearch.toLowerCase();
      filtered = filtered.filter((u) =>
        `${u.USERID} ${u.USERNAME} ${u.EMAIL} ${u.ALIAS}`
          .toLowerCase()
          .includes(t)
      );
    }

    return filtered;
  }, [users, usersSearch, loggedUser]);



  if (!loggedUser)
    return (
      <div className="config-page-container">
        <BusyIndicator active size="Large" />
      </div>
    );

  const headerAvatar =
    profileForm.AVATAR || `https://i.pravatar.cc/48?u=${profileForm.USERID}`;

  const bigAvatar =
    profileForm.AVATAR || `https://i.pravatar.cc/150?u=${profileForm.USERID}`;

  // ======================================================
  // 🔹 RENDER
  // ======================================================
  return (
    <div className="config-page-container">
      {/* HEADER */}
      <div className="config-page-header">
        <div>
          <Title level="H1">Configuración</Title>
          <Text>Administra tu perfil y los usuarios del sistema</Text>
        </div>

        <div className="config-header-user">
          <img src={headerAvatar} alt="" className="config-header-avatar" />
          <div>
            <Text>{profileForm.USERNAME}</Text>
            <Text>{profileForm.USERID}</Text>
          </div>
        </div>
      </div>

      {message && (
        <MessageStrip
          design={mapMsgDesign(message.type)}
          style={{ marginBottom: "1rem" }}
        >
          {message.text}
        </MessageStrip>
      )}

      <TabContainer
        activeTabId={activeTab}
        onTabSelect={(e) => {
          const tab = e.detail?.tab || e.detail?.selectedTab;
          if (tab?.id) setActiveTab(tab.id);
        }}
      >
        {/* TAB PERFIL */}
        <Tab id="tab-profile" text="Mi Perfil" icon="employee">
          <Card>
            <div className="config-page-content">
              <FlexBox
                direction={FlexBoxDirection.Row}
                style={{ gap: "2rem" }}
              >
                {/* AVATAR */}
                <div>
                  <img
                    src={bigAvatar}
                    alt=""
                    className="config-page-avatar"
                    style={{ cursor: "pointer" }}
                    onClick={() => setAvatarDialogOpen(true)}
                  />

                </div>

                {/* FORM */}
                <div className="config-page-form">
                  <Label>ID</Label>
                  <Input value={profileForm.USERID} disabled />

                  <Label>Nombre</Label>
                  <Input
                    value={profileForm.USERNAME}
                    onInput={handleProfileChange("USERNAME")}
                  />

                  <Label>Email</Label>
                  <Input
                    value={profileForm.EMAIL}
                    onInput={handleProfileChange("EMAIL")}
                  />

                  <Label>Alias</Label>
                  <Input
                    value={profileForm.ALIAS || ""}
                    onInput={handleProfileChange("ALIAS")}
                  />

                  <Label>Teléfono</Label>
                  <Input
                    value={profileForm.PHONENUMBER || ""}
                    onInput={handleProfileChange("PHONENUMBER")}
                  />

                  <Label>Extensión</Label>
                  <Input
                    value={profileForm.EXTENSION || ""}
                    onInput={handleProfileChange("EXTENSION")}
                  />

                  <Label>Company ID</Label>
                  <Input
                    value={profileForm.COMPANYID || ""}
                    onInput={handleProfileChange("COMPANYID")}
                  />

                  <Label>Employee ID</Label>
                  <Input
                    value={profileForm.EMPLOYEEID || ""}
                    onInput={handleProfileChange("EMPLOYEEID")}
                  />
                </div>
              </FlexBox>

              <div className="config-page-footer">
                <Button onClick={handleProfileSave} disabled={savingProfile}>
                  {savingProfile ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </Card>
        </Tab>

        {/* TAB USUARIOS */}
        <Tab id="tab-users" text="Usuarios" icon="settings">
          <Card>
            <div className="config-page-content">
              <div className="config-users-header">
                <Title level="H2">Usuarios</Title>
                <Input
                  placeholder="Buscar..."
                  value={usersSearch}
                  onInput={(e) => setUsersSearch(e.target.value)}
                  icon="search"
                />
                <Button onClick={fetchUsers} icon="refresh">
                  Recargar
                </Button>
              </div>

              {loadingUsers ? (
                <BusyIndicator active size="Large" />
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Alias</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isMe = u.USERID === loggedUser.USERID;
                      return (
                        <tr
                          key={u.USERID}
                          className={isMe ? "current-user" : ""}
                        >
                          <td>{u.USERID}</td>
                          <td>{u.USERNAME}</td>
                          <td>{u.EMAIL || "-"}</td>
                          <td>{u.ALIAS || "-"}</td>
                          <td>
                            <span
                              className={
                                u.ACTIVED
                                  ? "status-badge status-active"
                                  : "status-badge status-inactive"
                              }
                            >
                              {isMe ? "Yo" : u.ACTIVED ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </Tab>
      </TabContainer>


    </div>
  );
}
