// srv/api/models/zterrorlog-model.js
import mongoose from "mongoose";

const zterrorlogSchema = new mongoose.Schema(
  {
    //NUEVOS CAMPOS
    ERRORID: {
      type: Integer,
      required: true,
    },
    CANSEEUSERS: {
      type: [String],
      required: true,
    },
    ASIGNEDUSERS: {
      type: [String],
    },
    RESOLVEDBY: {
      type: String,
    },
    COMMENTS: {
      type: [Object],
    },
    FINALSOLUTION: {
      type: String,
    },
    //=============

    //CAMPO A MODIFICAR
    CONTEXT: {
      type: [
        {
          stack: { type: String },
          endponint: String,
          requestBody: Object,
          browser: String,
          
        },
      ],
      default: {},
    },
    //----------------
    ERRORMESSAGE: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    ERRORDATETIME: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ERRORCODE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    ERRORSOURCE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    AI_REQUESTED: {
      type: Boolean,
      default: false,
    },
    AI_RESPONSE: {
      type: String,
      maxlength: 5000,
      default: null,
    },
    STATUS: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "RESOLVED", "IGNORED"],
      default: "NEW",
    },
    SEVERITY: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
      default: "ERROR",
    },
    MODULE: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    APPLICATION: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    CREATED_BY_APP: {
      //ID DEL USUARIO
      type: String,
      default: null,
      maxlength: 255,
      trim: true,
    },
    // ⚙️ Campos adicionales sugeridos para próximas versiones
    // PAGE: {
    //   type: String,
    //   default: null, // Página de la app donde surgió el error
    //   maxlength: 500,
    // },
    PROCESS: {
      type: String,
      default: null, // Proceso o flujo donde ocurrió el error
      maxlength: 500,
    },
    ENVIRONMENT: {
      type: String,
      enum: ["DEV", "TEST", "PROD"],
      default: "DEV",
    },
    DEVICE: {
      type: String,
      default: null, // Ejemplo: 'Desktop', 'Mobile', 'Tablet'
    },
  },
  { collection: "ZTERRORLOG" }
);

export default mongoose.model("ZTERRORLOG", zterrorlogSchema);
