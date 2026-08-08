import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function App() {
  // 1. ESTADOS DE LA SESIÓN Y USUARIO
  const [userRole, setUserRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  // 2. ESTADOS DEL LOGIN
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 3. ESTADOS DEL ADMINISTRADOR
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para la búsqueda

  // 4. ESTADOS DEL TRABAJADOR
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // EFECTO: Cargar lista de trabajadores (Solo Admin)
  useEffect(() => {
    if (userRole === 'admin') {
      const q = query(collection(db, 'trabajadores'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const workersArray = [];
        querySnapshot.forEach((documento) => {
          workersArray.push({ id: documento.id, ...documento.data() });
        });
        setWorkers(workersArray);
      });
      return () => unsubscribe();
    }
  }, [userRole]);

  // FUNCIÓN: Filtrar trabajadores en tiempo real
  const filteredWorkers = workers.filter((worker) => {
    const term = searchTerm.toLowerCase();
    const workerName = worker.nombre ? worker.nombre.toLowerCase() : '';
    const workerRut = worker.rut ? worker.rut.toLowerCase() : '';
    return workerName.includes(term) || workerRut.includes(term);
  });

  // FUNCIÓN: Manejar el Inicio de Sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginId === 'admin@flesa.cl' && loginPass === 'admin') {
      setUserRole('admin');
      setCurrentUser({ nombre: 'Administrador RRHH' });
      return;
    }

    try {
      const q = query(collection(db, 'trabajadores'), where('rut', '==', loginId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const workerData = querySnapshot.docs[0].data();
        const workerId = querySnapshot.docs[0].id;
        const dbPassword = workerData.password || 'pass';

        if (loginPass === dbPassword) {
          setUserRole('worker');
          setCurrentUser({ id: workerId, ...workerData });
          return;
        } else {
          setLoginError('Contraseña incorrecta.');
          return;
        }
      } else {
        setLoginError('Credenciales incorrectas o RUT no registrado.');
      }
    } catch (error) {
      setLoginError('Error de conexión. Inténtalo más tarde.');
    }
  };

  // FUNCIÓN: Cerrar Sesión
  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setLoginId('');
    setLoginPass('');
    setPasswordMessage('');
    setSearchTerm('');
  };

  // FUNCIONES DEL ADMINISTRADOR
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!name || !rut) return;
    try {
      await addDoc(collection(db, 'trabajadores'), {
        nombre: name,
        rut: rut,
        fechaRegistro: new Date().toISOString(),
        estado: 'Al día',
        password: 'pass'
      });
      setName('');
      setRut('');
    } catch (error) {
      alert("Hubo un error al guardar al trabajador.");
    }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas ELIMINAR a este trabajador? Esta acción no se puede deshacer.")) {
      try {
        await deleteDoc(doc(db, 'trabajadores', id));
      } catch (error) {
        alert("Error al eliminar el registro.");
      }
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm("¿Deseas reiniciar la contraseña de este trabajador a 'pass'?")) {
      try {
        await updateDoc(doc(db, 'trabajadores', id), {
          password: 'pass'
        });
        alert("Contraseña reiniciada con éxito a 'pass'.");
      } catch (error) {
        alert("Error al reiniciar la contraseña.");
      }
    }
  };

  // FUNCIONES DEL TRABAJADOR
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await updateDoc(doc(db, 'trabajadores', currentUser.id), {
        password: newPassword
      });
      setPasswordMessage('¡Contraseña actualizada con éxito!');
      setNewPassword('');
    } catch (error) {
      setPasswordMessage('Hubo un error al actualizar la contraseña.');
    }
  };

  // ==========================================
  // VISTA 1: PANTALLA DE INICIO DE SESIÓN
  // ==========================================
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Flesan RH</h1>
            <p className="text-gray-500">Portal de Documentos Legales</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario (Correo Admin o RUT Trabajador)</label>
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Ej: admin@flesa.cl o 12.345.678-9" className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Ingresa tu contraseña" className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500" required />
            </div>
            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-200">{loginError}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors">
              Ingresar al Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: PANTALLA DEL TRABAJADOR
  // ==========================================
  if (userRole === 'worker') {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-blue-800">Mi Perfil Flesan</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium">Cerrar Sesión</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">{currentUser.nombre}</h2>
          <p className="text-gray-500 mt-1">RUT: {currentUser.rut}</p>
          <div className="mt-4 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
            Estado: {currentUser.estado || 'Al día'}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Seguridad de la Cuenta</h3>
          <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input type="password" placeholder="Escribe tu nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border border-gray-300 p-2 rounded w-full sm:w-64 focus:outline-none focus:border-blue-500" required />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
              Actualizar Contraseña
            </button>
          </form>
          {passwordMessage && <p className={`mt-3 text-sm font-medium ${passwordMessage.includes('éxito') ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage}</p>}
        </div>
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-dashed border-gray-300 text-gray-500">
          <p>Tus documentos y firmas estarán disponibles aquí próximamente.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 3: PANTALLA DEL ADMINISTRADOR
  // ==========================================
  if (userRole === 'admin') {
    return (
      <div className="p-8 max-w-5xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-green-800">Directorio de Personal - Admin</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium">Cerrar Sesión</button>
        </div>

        {/* Sección: Ingresar Trabajador */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Ingresar Nuevo Trabajador</h2>
          <form onSubmit={handleAddWorker} className="flex flex-wrap gap-4">
            <input type="text" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 p-2 rounded flex-1 min-w-[200px] focus:outline-none focus:border-green-500" />
            <input type="text" placeholder="RUT (ej: 12.345.678-9)" value={rut} onChange={(e) => setRut(e.target.value)} className="border border-gray-300 p-2 rounded w-full sm:w-48 focus:outline-none focus:border-green-500" />
            <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded font-medium hover:bg-green-800 transition-colors w-full sm:w-auto">
              Guardar Trabajador
            </button>
          </form>
        </div>

        {/* Sección: Búsqueda y Lista */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Personal Registrado ({filteredWorkers.length})
            </h2>
            <div className="w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Buscar por nombre, apellido o RUT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-green-500 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
                <div className="mb-3 md:mb-0">
                  <p className="font-bold text-lg text-gray-800">{worker.nombre}</p>
                  <p className="text-gray-500 text-sm">RUT: {worker.rut}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mr-2">
                    {worker.estado}
                  </span>
                  <button onClick={() => handleResetPassword(worker.id)} className="text-yellow-600 hover:bg-yellow-50 border border-yellow-200 px-3 py-1 rounded text-sm transition-colors" title="Restablecer clave a 'pass'">
                    Reiniciar Clave
                  </button>
                  <button onClick={() => handleDeleteWorker(worker.id)} className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded text-sm transition-colors">
                    Borrar
                  </button>
                  <button className="text-gray-400 border border-gray-300 px-3 py-1 rounded text-sm cursor-not-allowed opacity-50">
                    Ver Documentos
                  </button>
                </div>
              </div>
            ))}
            
            {/* Mensajes de lista vacía */}
            {workers.length === 0 && (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No hay trabajadores registrados en la base de datos aún.
              </div>
            )}
            {workers.length > 0 && filteredWorkers.length === 0 && (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No se encontraron resultados para "{searchTerm}".
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
