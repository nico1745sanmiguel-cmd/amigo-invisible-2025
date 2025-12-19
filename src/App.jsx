import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, set, onValue, update } from "firebase/database";
import './App.css';

function App() {
  const [nombre, setNombre] = useState("");
  const [estadoLocal, setEstadoLocal] = useState({ participantes: [], resultado: {}, vistos: [] });
  const [verPara, setVerPara] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const queryParams = new URLSearchParams(window.location.search);
  const isAdmin = queryParams.get("admin") === "1234";

  useEffect(() => {
    const dbRef = ref(db, 'sorteo/');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEstadoLocal({
          participantes: data.participantes || [],
          resultado: data.resultado || {},
          vistos: data.vistos || []
        });
      }
      setCargando(false);
    });
  }, []);

  const agregarParticipante = () => {
    const limpio = nombre.trim();
    if (limpio !== "" && !estadoLocal.participantes.includes(limpio)) {
      const nuevaLista = [...estadoLocal.participantes, limpio];
      // Guardamos directamente en la rama de participantes
      set(ref(db, 'sorteo/participantes'), nuevaLista);
      setNombre("");
    }
  };

  const realizarSorteo = () => {
    if (estadoLocal.participantes.length < 2) return alert("¡Faltan personas!");
    let p = [...estadoLocal.participantes];
    let m = [...p];
    let esValido = false;

    while (!esValido) {
      m.sort(() => Math.random() - 0.5);
      esValido = p.every((n, i) => n !== m[i]);
    }

    const parejas = {};
    p.forEach((n, i) => { parejas[n] = m[i]; });
    
    // Guardamos el resultado en la nube
    update(ref(db, 'sorteo/'), { resultado: parejas, vistos: [] });
    alert("¡Sorteo listo! Avisale a tus amigos.");
  };

  const marcarComoVisto = (persona) => {
    const nuevosVistos = [...(estadoLocal.vistos || []), persona];
    update(ref(db, 'sorteo/'), { vistos: nuevosVistos });
    setVerPara(null);
  };

  if (cargando) return <div className="container"><h1>Cargando... 🎄</h1></div>;

  const haySorteo = Object.keys(estadoLocal.resultado || {}).length > 0;

  return (
    <div className="container">
      <h1>🎄 Amigo Invisible 🎁</h1>

      {isAdmin && (
        <div className="admin-panel" style={{background: '#fff3e0', padding: '10px', borderRadius: '10px', marginBottom: '20px', border: '2px solid orange'}}>
          <p><strong>Panel Admin</strong></p>
          {!haySorteo && (
            <>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre..." />
              <button className="btn-add" onClick={agregarParticipante}>Agregar (+)</button>
              <button className="btn-sortear" onClick={realizarSorteo}>¡SORTEAR YA!</button>
            </>
          )}
          <button onClick={() => set(ref(db, 'sorteo/'), {participantes:[], resultado:{}, vistos:[]})} style={{background: 'red', color: 'white', marginTop: '10px'}}>REINICIAR TODO</button>
        </div>
      )}

      {!haySorteo ? (
        <div className="waiting-screen">
          <h3>¡Bienvenidos! 👋</h3>
          <p>Ya están anotados para jugar:</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'}}>
            {estadoLocal.participantes.map((p, i) => (
              <span key={i} style={{background: 'white', padding: '5px 15px', borderRadius: '20px', border: '2px solid var(--xmas-green)'}}>
                {p}
              </span>
            ))}
          </div>
          <p style={{marginTop: '20px', fontStyle: 'italic'}}>Esperando que el organizador haga el sorteo... 🎅</p>
        </div>
      ) : (
        <div>
          <h3>🎉 ¡Busca tu nombre! 🎉</h3>
          <div className="cards-container">
            {estadoLocal.participantes
              .filter(p => !(estadoLocal.vistos || []).includes(p))
              .map(p => (
                <button key={p} className="secret-card-btn" onClick={() => setVerPara(p)}>
                  {p} <br/> 🎁
                </button>
              ))
            }
          </div>
        </div>
      )}

      {verPara && (
        <div className="revelation-box">
          <h2>Hola {verPara},</h2>
          <p>Te tocó regalarle a:</p>
          <div className="gift-name">{estadoLocal.resultado[verPara]}</div>
          <button className="btn-hide" onClick={() => marcarComoVisto(verPara)}>
            LISTO, YA LO MEMORICÉ 🙈
          </button>
        </div>
      )}
    </div>
  );
}

export default App;