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
  const isAdmin = queryParams.get("admin") === "1234"; // Tu clave de admin

  // Escuchar la base de datos en tiempo real
  useEffect(() => {
    const dbRef = ref(db, 'sorteo/');
    return onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      setEstadoLocal({
        participantes: data?.participantes || [],
        resultado: data?.resultado || {},
        vistos: data?.vistos || []
      });
      setCargando(false);
    });
  }, []);

  const guardarEnNube = (nuevoEstado) => {
    set(ref(db, 'sorteo/'), nuevoEstado);
  };

  const agregarParticipante = () => {
    if (nombre.trim() !== "" && !estadoLocal.participantes.includes(nombre.trim())) {
      const nuevaLista = [...estadoLocal.participantes, nombre.trim()];
      guardarEnNube({ ...estadoLocal, participantes: nuevaLista });
      setNombre("");
    }
  };

  // Algoritmo de sorteo mejorado (Fisher-Yates)
  const realizarSorteo = () => {
    if (estadoLocal.participantes.length < 2) return alert("¡Mínimo 2 personas!");
    
    let participantes = [...estadoLocal.participantes];
    let resultado = {};
    let esValido = false;

    while (!esValido) {
      let pool = [...participantes];
      // Mezcla
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      // Validar que nadie se regale a sí mismo
      esValido = participantes.every((p, i) => p !== pool[i]);
      if (esValido) {
        participantes.forEach((p, i) => { resultado[p] = pool[i]; });
      }
    }

    guardarEnNube({ ...estadoLocal, resultado: resultado, vistos: [] });
    alert("¡Sorteo realizado! Ya pueden avisar al grupo.");
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

      {/* --- PANEL ADMIN: Solo si sos admin y NO hay sorteo todavía --- */}
      {isAdmin && !haySorteo && (
        <div className="admin-panel">
          <h3 style={{color: 'red'}}>Estás en Modo Administrador</h3>
          <input 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && agregarParticipante()}
            placeholder="Escribí un nombre..." 
          />
          <button className="btn-add" onClick={agregarParticipante}>Agregar a la lista</button>
          <button className="btn-sortear" onClick={realizarSorteo}>¡CERRAR LISTA Y SORTEAR! 🎅</button>
        </div>
      )}

      {/* --- VISTA DE PARTICIPANTES --- */}
      {!haySorteo ? (
        <div className="waiting-screen">
          <h3>¡Bienvenidos! 👋</h3>
          <p>El organizador está anotando a todos. Cuando termine, aparecerán los regalos acá.</p>
          <p><strong>Ya están anotados:</strong></p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center'}}>
            {estadoLocal.participantes.map((p, i) => (
              <span key={i} style={{background: '#eee', padding: '5px 10px', borderRadius: '15px', fontSize: '0.9rem'}}>
                ✅ {p}
              </span>
            ))}
          </div>
          {estadoLocal.participantes.length === 0 && <p>Todavía no hay nadie en la lista...</p>}
        </div>
      ) : (
        /* EL SORTEO YA SE HIZO: Mostramos los botones */
        <div>
          <h3>🎉 ¡Sorteo listo! 🎉</h3>
          <p>Buscá tu nombre y descubrí a quién le regalás:</p>
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
          {estadoLocal.vistos?.length === estadoLocal.participantes.length && (
             <p style={{marginTop: '20px'}}>🎊 ¡Todos ya descubrieron a su amigo invisible! 🎊</p>
          )}
        </div>
      )}

      {/* VENTANA DE REVELACIÓN */}
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

      {/* REINICIAR (Solo Admin) */}
      {isAdmin && (
        <button 
          onClick={() => window.confirm("¿Borrar todo y empezar de cero?") && guardarEnNube({participantes:[], resultado:{}, vistos:[]})} 
          style={{marginTop: '50px', background: 'none', border: '1px solid #ccc', color: '#999', fontSize: '0.7rem', cursor: 'pointer'}}
        >
          BORRAR TODO EL SORTEO
        </button>
      )}
    </div>
  );
}

export default App;