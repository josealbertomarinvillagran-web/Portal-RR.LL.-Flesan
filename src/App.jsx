import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';

function App() {
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');

  // 1. CONEXIÓN EN TIEMPO REAL: Escuchar la bóveda de Firebase
  useEffect(() => {
    const q = query(collection(db, 'trabajadores'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workersArray = [];
      querySnapshot.forEach((doc) => {
        workersArray.push({ id: doc.id, ...doc.data() });
      });
      setWorkers(workersArray);
    });
    
    // Limpiar la conexión si cerramos la app
    return () => unsubscribe();
  }, []);

  // 2. FUNCIÓN PARA GUARDAR: Enviar datos a Firebase
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!name || !rut) return;

    try {
      await addDoc(collection(db, 'trabajadores'), {
        nombre: name,
        rut: rut,
        fechaRegistro: new Date().toISOString(),
        estado: 'Al día' // Estado por defecto para los documentos
      });
      // Limpiar las casillas después de guardar
      setName('');
      setRut('');
    } catch (error) {
      console.error("Error al guardar en la bóveda:", error);
      alert("Hubo un error al guardar. Revisa la consola.");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8 text-green-800 border-b pb-4">
        Flesan RH - Directorio de Personal
      </h1>

      {/* SECCIÓN: Formulario de Ingreso */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Ingresar Nuevo Trabajador</h2>
        <form onSubmit={handleAddWorker} className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 p-2 rounded flex-1 min-w-[200px] focus:outline-none focus:border-green-500"
          />
          <input
            type="text"
            placeholder="RUT (ej: 12.345.678-9)"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full sm:w-48 focus:outline-none focus:border-green-500"
          />
          <button 
            type="submit" 
            className="bg-green-700 text-white px-6 py-2 rounded font-medium hover:bg-green-800 transition-colors w-full sm:w-auto"
          >
            Guardar Trabajador
          </button>
        </form>
      </div>

      {/* SECCIÓN: Lista de Personal */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Personal Registrado ({workers.length})
        </h2>
        <div className="space-y-3">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm">
              <div>
                <p className="font-bold text-lg text-gray-800">{worker.nombre}</p>
                <p className="text-gray-500 text-sm">RUT: {worker.rut}</p>
              </div>
              <div className="mt-3 sm:mt-0 flex gap-3 items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {worker.estado}
                </span>
                <button className="text-gray-400 hover:text-green-700 border border-gray-300 px-3 py-1 rounded text-sm transition-colors cursor-not-allowed opacity-50" title="Función de documentos en desarrollo">
                  Ver Documentos
                </button>
              </div>
            </div>
          ))}
          
          {workers.length === 0 && (
            <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No hay trabajadores registrados en la base de datos aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
