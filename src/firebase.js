import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCmkotsJsP_OVLctnkjp_3yJjowo0TZrZs",
  authDomain: "amigo-invisible-c9d0a.firebaseapp.com",
  projectId: "amigo-invisible-c9d0a",
  storageBucket: "amigo-invisible-c9d0a.firebasestorage.app",
  messagingSenderId: "844369269184",
  appId: "1:844369269184:web:d9073a6edadfd536a2f825",
  // Agregamos esta línea para que sepa exactamente dónde está tu base de datos
  databaseURL: "https://amigo-invisible-c9d0a-default-rtdb.firebaseio.com"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos para que App.jsx la pueda usar
export const db = getDatabase(app);