import React, { useEffect, useState } from "react";
import { Button, Card, Title, Text, Input, Label, MessageBox, TabContainer, Tab } from "@ui5/webcomponents-react";
import axios from "axios";
import "../styles/configPage.css";

import "@ui5/webcomponents/dist/TabContainer.js";
import "@ui5/webcomponents/dist/Tab.js";

export default function ConfigPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [activeTab, setActiveTab] = useState("tab-profile");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setForm(userData);
    }
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const url = "http://localhost:3333/api/users/crud?ProcessType=getAll&DBServer=MongoDB&LoggedUser=SYSTEM";
      
      const response = await axios.post(url, { usuario: {} });
      
      let usuariosData = [];
      
      if (response.data?.value && Array.isArray(response.data.value) && Array.isArray(response.data.value[0].data)) {
        usuariosData = response.data.value[0].data;
      }
      //Array directo
      else if (Array.isArray(response.data)) {
        usuariosData = response.data;
      }
      
      if (usuariosData.length > 0) {
        
        const flattenedUsers = usuariosData.reduce((acc, item) => {
          let u = item || {};

          // Si el item tiene un array de usuarios anidado (dataRes o data), retornar ese array.
          if (u.dataRes && Array.isArray(u.dataRes) && u.dataRes.length > 0) {
            return acc.concat(u.dataRes);
          } else if (u.data && Array.isArray(u.data) && u.data.length > 0) {
            return acc.concat(u.data);
          } else if (u.dataRes && u.dataRes.USERID) {
            // Si es un objeto de usuario directamente en dataRes
            return acc.concat(u.dataRes);
          } else if (u.data && u.data.USERID) {
            // Si es un objeto de usuario directamente en data
            return acc.concat(u.data);
          } else if (u.USERID || u.id) { 
            // Si es un objeto de usuario en el nivel superior (el caso que queremos que siempre se incluya)
            return acc.concat(u);
          }
          return acc; // Ignorar wrappers vacíos o irrelevantes
        }, []);
        
        // Normalizar los objetos de usuario finales
        const normalized = flattenedUsers.map((u, idx) => {
          return {
            _id: u._id || u.id || null,
            USERID: u.USERID || u.userid || u.id || u._id || null,
            USERNAME: u.USERNAME || u.username || u.NAME || "",
            EMAIL: u.EMAIL || u.email || "",
            ALIAS: u.ALIAS || u.alias || "",
            ACTIVED: typeof u.ACTIVED === 'boolean' ? u.ACTIVED : (u.ACTIVE || true),
            raw: u, // Usamos u aquí, ya que es el objeto de usuario aplanado
          };
        });

        setUsers(normalized);
        setMessage({
          type: "success",
          text: `✓ Se cargaron ${normalized.length} usuarios`,
        });
        setTimeout(() => setMessage({ type: null, text: "" }), 3000);
      } else {
        setUsers([]);
        setMessage({
          type: "warning",
          text: "⚠ No se encontraron usuarios en la respuesta",
        });
      }
    } catch (err) {
      setUsers([]);
      setMessage({
        type: "error",
        text: `❌ Error: ${err.message}. Verifica que gadev-master esté corriendo en puerto 3333`,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTabChange = (e) => {
    try {
      let selectedTabId = null;
      
      // En UI5 WebComponents, el evento puede venir de diferentes formas
      if (e?.detail?.tab?.id) {
        selectedTabId = e.detail.tab.id;
      } else if (e?.detail?.selectedTab?.id) {
        selectedTabId = e.detail.selectedTab.id;
      } else if (e?.target?.getAttribute('id')) {
        selectedTabId = e.target.getAttribute('id');
      }
      
      if (selectedTabId) {
        setActiveTab(selectedTabId);
        if (selectedTabId === "tab-users") {
          fetchUsers();
        }
      }
    } catch (error) {
      // Manejo de error silencioso para eventos de tabulación
    }
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const saveToServer = async (updatedUser) => {
    try {
      const base = "http://localhost:3333/api/users/crud";
      const params = new URLSearchParams({
        ProcessType: "updateOne",
        DBServer: "MongoDB",
        LoggedUser: updatedUser?.USERID || "SYSTEM",
      }).toString();

      const body = { usuario: updatedUser };
      await axios.post(`${base}?${params}`, body);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: null, text: "" });

    try {
      // Guardar localmente
      localStorage.setItem("loggedUser", JSON.stringify(form));
      setUser(form);

      // Intentar guardar en servidor
      const serverSuccess = await saveToServer(form);

      if (serverSuccess) {
        setMessage({
          type: "success",
          text: "✓ Perfil guardado exitosamente",
        });
      } else {
        setMessage({
          type: "warning",
          text: "⚠ Cambios guardados localmente (servidor no disponible)",
        });
      }

      setTimeout(() => setMessage({ type: null, text: "" }), 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: "✗ Error al guardar los cambios",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(user);
    setMessage({ type: null, text: "" });
  };

  if (!user) {
    return <div className="config-page-container">Cargando...</div>;
  }

  return (
    <div className="config-page-container">
      <div className="config-page-header">
        <Title level="H1">Configuración</Title>
        <Text>Gestiona tu perfil y usuarios</Text>
      </div>

      <div className="config-page-tabs-wrapper">
        <TabContainer activeTabId={activeTab} onTabSelect={handleTabChange}>
          <Tab id="tab-profile" text="Mi Perfil" additionalText="Editar perfil" icon="employee">
            <Card className="config-page-card">
              <div className="config-page-content">
                {/* Avatar y Usuario */}
                <div className="config-avatar-section">
                  <img
                    src={`https://i.pravatar.cc/150?u=${form.USERID}`}
                    alt="avatar"
                    className="config-page-avatar"
                  />
                  <div className="config-avatar-info">
                    <Text className="config-avatar-userid">{form.USERID}</Text>
                    <Title level="H3">{form.USERNAME}</Title>
                  </div>
                </div>

                {/* Campos de formulario */}
                <div className="config-page-form">
                  <div className="config-page-field-group">
                    <Label>ID de Usuario</Label>
                    <Input
                      value={form?.USERID || ""}
                      disabled
                      placeholder="ID del usuario"
                      className="config-page-input"
                    />
                  </div>

                  <div className="config-page-field-group">
                    <Label>Nombre de Usuario</Label>
                    <Input
                      value={form?.USERNAME || ""}
                      onInput={handleChange("USERNAME")}
                      placeholder="Tu nombre de usuario"
                      className="config-page-input"
                    />
                  </div>

                  <div className="config-page-field-group">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form?.EMAIL || ""}
                      onInput={handleChange("EMAIL")}
                      placeholder="tu@email.com"
                      className="config-page-input"
                    />
                  </div>

                  <div className="config-page-field-group">
                    <Label>Alias</Label>
                    <Input
                      value={form?.ALIAS || ""}
                      onInput={handleChange("ALIAS")}
                      placeholder="Tu alias"
                      className="config-page-input"
                    />
                  </div>
                </div>

                {/* Mensaje de estado */}
                {message.text && (
                  <div className={`config-page-message config-page-message-${message.type}`}>
                    {message.text}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="config-page-footer">
                  <Button
                    design="Transparent"
                    onClick={handleCancel}
                    disabled={saving}
                    className="config-page-btn-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    design="Emphasized"
                    onClick={handleSave}
                    disabled={saving}
                    className="config-page-btn-save"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            </Card>
          </Tab>

          <Tab id="tab-users" text="Usuarios" additionalText="Ver todos" icon="people-2">
            <Card className="config-page-card">
              <div className="config-page-content">
                <div className="config-users-header">
                  <Title level="H2">Lista de Usuarios</Title>
                  {loadingUsers && <Text>Cargando usuarios...</Text>}
                </div>

                {loadingUsers ? (
                  <div className="config-users-empty">
                    <Text>⏳ Cargando usuarios...</Text>
                  </div>
                ) : users.length === 0 ? (
                  <div className="config-users-empty">
                    <Text>❌ No hay usuarios disponibles. Verifica que el servidor esté corriendo.</Text>
                  </div>
                ) : (
                  <div className="config-users-table">
                    
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
                        {users.map((u, index) => (
                          <tr key={u.USERID || `user-${index}`} className={u.USERID === user?.USERID ? "current-user" : ""}>
                            <td>{u.USERID}</td>
                            <td className="user-name">{u.USERNAME}</td>
                            <td>{u.EMAIL || "-"}</td>
                            <td>{u.ALIAS || "-"}</td>
                            <td>
                              <span className="status-badge">
                                {u.USERID === user?.USERID ? "Yo" : "Activo"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </Tab>
        </TabContainer>
      </div>
    </div>
  );
}