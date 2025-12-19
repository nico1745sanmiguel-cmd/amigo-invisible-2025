import React, { useState } from 'react';
import './App.css';

// Función para mezclar los nombres (Algoritmo de Fisher-Yates)
const mezclarNombres = (lista) => {
  let mezcla = [...lista];
  let esValido = false;

  while (!esValido) {
    for (let i = mezcla.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mezcla[i], mezcla[j]] = [mezcla[j], mezcla[i]];
    }
    // Verificamos que nadie se haya sacado a sí mismo
    esValido = lista.every((nombre, index) => nombre !== mezcla[index]);
    if (lista.length <= 1) break;
  }
  return mezcla;
};

function App() {
  const [nombre, setNombre] = useState("");
  const [participantes, setParticipantes] = useState([]);
  const [resultado, setResultado] = useState(null); // Parejas formadas
  const [verPara, setVerPara] = useState(null);    // Quién está viendo ahora
  const [vistos, setVistos] = useState([]);        // Lista de gente que ya vio su amigo

  const agregarParticipante = () => {
    if (nombre.trim() !== "" && !participantes.includes(nombre)) {
      setParticipantes([...participantes, nombre.trim()]);
      setNombre("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') agregarParticipante();
  };

  const realizarSorteo = () => {
    if (participantes.length < 2) return alert("¡Mínimo 2 personas!");
    const mezclados = mezclarNombres(participantes);
    const parejas = {};
    participantes.forEach((p, i) => {
      parejas[p] = mezclados[i];
    });
    setResultado(parejas);
  };

  // Función para cuando el usuario confirma que ya vio su amigo
  const marcarComoVisto = (nombreFinalizado) => {
    setVistos([...vistos, nombreFinalizado]);
    setVerPara(null);
  };

  const reiniciar = () => {
    if (window.confirm("¿Seguro querés borrar todo y empezar de cero?")) {
      setParticipantes([]);
      setResultado(null);
      setVerPara(null);
      setVistos([]);
    }
  };

  return (
    <div className="container">
      <h1>🎄 Amigo Invisible 🎁</h1>

      {!resultado ? (
        // --- PANTALLA 1: CARGA DE NOMBRES ---
        <div>
          <p>Escribí los nombres de los que juegan:</p>
          <input 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej: Nico..."
          />
          <button className="btn-add" onClick={agregarParticipante}>Agregar Nombre (+)</button>
          
          <ul>
            {participantes.map((p, i) => (
              <li key={i}>🏷️ {p}</li>
            ))}
          </ul>

          {participantes.length >= 2 && (
            <button className="btn-sortear" onClick={realizarSorteo}>
              ¡REALIZAR SORTEO! 🎅
            </button>
          )}
        </div>
      ) : (
        // --- PANTALLA 2: REVELACIÓN SECRETA ---
        <div>
          {vistos.length === participantes.length ? (
            <div>
              <h3>🎊 ¡Todos ya tienen su amigo! 🎊</h3>
              <p>El sorteo ha terminado con éxito.</p>
            </div>
          ) : (
            <>
              <h3>🎉 ¡Sorteo realizado! 🎉</h3>
              <p>Cada uno busque su nombre y toque el regalo:</p>
              
              <div className="cards-container">
                {participantes
                  .filter(p => !vistos.includes(p)) // Filtramos los que YA VIERON
                  .map((p) => (
                    <button 
                      key={p} 
                      onClick={() => setVerPara(p)}
                      className="secret-card-btn"
                    >
                      {p} 🎁
                    </button>
                  ))
                }
              </div>
            </>
          )}

          {/* VENTANA EMERGENTE DE REVELACIÓN */}
          {verPara && (
            <div className="revelation-box">
              <h2>Hola {verPara},</h2>
              <p>Tu amigo invisible es:</p>
              <div className="gift-name">{resultado[verPara]}</div>
              <p style={{fontSize: '0.8rem', fontStyle: 'italic'}}>Memorizalo bien y cerrá abajo.</p>
              <button className="btn-hide" onClick={() => marcarComoVisto(verPara)}>
                YA LO VI, QUITAR MI NOMBRE 🙈
              </button>
            </div>
          )}

          <br /><br />
          <button onClick={reiniciar} style={{ background: 'none', border: 'none', textDecoration: 'underline', color: '#555', fontSize: '0.8rem' }}>
            Reiniciar todo el juego
          </button>
        </div>
      )}
    </div>
  );
}

export default App;