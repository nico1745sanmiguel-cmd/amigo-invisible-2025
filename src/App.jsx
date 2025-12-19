import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, set, onValue, update } from "firebase/database";
import './App.css';

function App() {
  const [nombre, setNombre] = useState("");
  const [estadoLocal, setEstadoLocal] = useState({ participantes: [], resultado: {}, vistos: [] });
  const [verPara, setVerPara] = useState(null);
  
  const queryParams = new URLSearchParams(window.location.search);
  const isAdmin = queryParams.get("admin") === "1234"; // Tu clave de admin

  useEffect(() => {
    const dbRef = ref(db, 'sorteo/');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEstadoLocal({
          participantes: data.participantes || [],
          resultado: data.resultado || {},
          vistos: data.vistos || []
        });
      }
    });
  }, []);

  const guardarEnNube = (nuevoEstado) => {
    set(ref(db, 'sorteo/'), nuevoEstado);
  };

  const agregarParticipante = () => {
    if (nombre.trim() !== "" && !estadoLocal.participantes.includes(nombre)) {
      const nuevaLista = [...estadoLocal.participantes, nombre.trim()];
      guardarEnNube({ ...estadoLocal, participantes: nuevaLista });
      setNombre("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') agregarParticipante();
  };

  const realizarSorteo = () => {
    let lista = [...estadoLocal.participantes];
    let mezcla = [...lista];
    let esValido = false;
    while (!esValido && lista.length > 1) {
      mezcla.sort(() => Math.random() - 0.5);
      esValido = lista.every((n, i) => n !== mezcla[i]);
    }
    const parejas = {};
    lista.forEach((n, i) => parejas[n] = mezcla[i]);
    guardarEnNube({ ...estadoLocal, resultado: parejas, vistos: [] });
  };

  const marcarComoVisto = (persona) => {
    const nuevosVistos = [...(estadoLocal.vistos || []), persona];
    update(ref(db, 'sorteo/'), { vistos: nuevosVistos });
    setVerPara(null);
  };

  const haySorteo = Object.keys(estadoLocal.resultado).length > 0;

  return (
    <div className="container">
      <h1>🎄 Amigo Invisible 🎁</h1>

      {/* --- CASO 1: NO HUBO SORTEO TODAVÍA --- */}
      {!haySorteo ? (
        isAdmin ? (
          /* Vista de Admin para cargar nombres */
          <div className="admin-panel">
            <h3>Panel de Control (Admin)</h3>
            <p>Agregá a los participantes:</p>
            <input 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Nombre del amigo..." 
            />
            <button className="btn-add" onClick={agregarParticipante}>Agregar (+)</button>
            <ul className="admin-list">
              {estadoLocal.participantes.map((p, i) => <li key={i}>🏷️ {p}</li>)}
            </ul>
            {estadoLocal.participantes.length >= 2 && (
              <button className="btn-sortear" onClick={realizarSorteo}>¡SORTEAR AHORA! 🎅</button>
            )}
          </div>
        ) : (
          /* Vista de Participante esperando */
          <div className="waiting-screen">
            <h3>¡Hola! 👋</h3>
            <p>El organizador está cargando los nombres.</p>
            <p>Ya están anotados:</p>
            <ul className="waiting-list">
              {estadoLocal.participantes.map((p, i) => <li key={i}>✅ {p}</li>)}
            </ul>
            <p className="small-text">Refrescá la página cuando te avisen que ya sorteamos.</p>
          </div>
        )
      ) : (
        /* --- CASO 2: EL SORTEO YA SE HIZO --- */
        <div>
          <h3>🎉 ¡Sorteo realizado! 🎉</h3>
          <p>Buscá tu nombre y tocá el regalo:</p>
          <div className="cards-container">
            {estadoLocal.participantes
              .filter(p => !(estadoLocal.vistos || []).includes(p))
              .map(p => (
                <button key={p} className="secret-card-btn" onClick={() => setVerPara(p)}>
                  {p} 🎁
                </button>
              ))
            }
          </div>
          
          {/* Si todos ya vieron su amigo */}
          {estadoLocal.vistos?.length === estadoLocal.participantes.length && (
             <p>🎊 ¡Todos ya tienen su regalo asignado! 🎊</p>
          )}
        </div>
      )}

      {/* VENTANA DE REVELACIÓN */}
      {verPara && (
        <div className="revelation-box">
          <h2>Hola {verPara},</h2>
          <p>Tu amigo invisible es:</p>
          <div className="gift-name">{estadoLocal.resultado[verPara]}</div>
          <button className="btn-hide" onClick={() => marcarComoVisto(verPara)}>
            LISTO, YA LO VI 🙈
          </button>
        </div>
      )}

      {/* BOTÓN REINICIAR (SOLO ADMIN) */}
      {isAdmin && (
        <button 
          onClick={() => {if(window.confirm("¿Borrar todo?")) guardarEnNube({participantes:[], resultado:{}, vistos:[]})}} 
          style={{marginTop: '50px', background: 'none', border: '1px solid #ccc', color: '#999', fontSize: '0.7rem'}}
        >
          REINICIAR TODO EL SORTEO
        </button>
      )}
    </div>
  );
}

export default App;