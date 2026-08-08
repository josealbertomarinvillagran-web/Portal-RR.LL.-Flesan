import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function App() {
  // 1. ESTADOS DE SESIÓN
  const [userRole, setUserRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 2. ESTADOS DEL ADMINISTRADOR
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState(null); // Para mostrar "Subiendo..."

  // 3. ESTADOS DEL TRABAJADOR
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

  const filteredWorkers = workers.filter((worker) => {
    const term = searchTerm.toLowerCase();
    const workerName = worker.nombre ? worker.nombre.toLowerCase() : '';
    const workerRut = worker.rut ? worker.rut.toLowerCase() : '';
    return workerName.includes(term) || workerRut.includes(term);
  });

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

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setLoginId('');
    setLoginPass('');
    setPasswordMessage('');
    setSearchTerm('');
  };

  // ==========================================
  // FUNCIONES DE ARCHIVOS (CLOUDINARY)
  // ==========================================

  // Subir PDF a Cloudinary y guardar el link en Firebase
  const handleFileUpload = async (workerId, currentDocs = [], event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(workerId); // Mostrar "Subiendo..."
    
    // Configuración de Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'documentos_flesan'); // Tu preset
    
    try {
      // 1. Enviar a Cloudinary
      const res = await fetch('https://api.cloudinary.com/v1_1/ki3o9nju/auto/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        // 2. Guardar enlace en Firebase
        const newDoc = {
          nombre: file.name,
          url: data.secure_url,
          fecha: new Date().toISOString(),
          firmado: false
        };
        
        await updateDoc(doc(db, 'trabajadores', workerId), {
          documentos: [...currentDocs, newDoc]
        });
        alert('Documento subido con éxito.');
      }
    } catch (error) {
      console.error(error);
      alert('Error al subir el documento.');
    } finally {
      setUploadingId(null);
    }
  };

  // Firmar Documento (Simulación de Aceptación Legal)
  const handleSignDocument = async (docIndex) => {
    if (!window.confirm("Al hacer clic en Aceptar, firmas legalmente este documento.")) return;

    const updatedDocs = [...(currentUser.documentos || [])];
    updatedDocs[docIndex].firmado = true;
    updatedDocs[docIndex].fechaFirma = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'trabajadores', currentUser.id), {
        documentos: updatedDocs
      });
      setCurrentUser({ ...currentUser, documentos: updatedDocs });
      alert("Documento firmado exitosamente.");
    } catch (error) {
      alert("Error al firmar.");
    }
  };


  // ==========================================
  // FUNCIONES DEL ADMINISTRADOR
  // ==========================================
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!name || !rut) return;
    try {
      await addDoc(collection(db, 'trabajadores'), {
        nombre: name,
        rut: rut,
        fechaRegistro: new Date().toISOString(),
        estado: 'Al día',
        password: 'pass',
        documentos: [] // Arreglo vacío para guardar futuros PDFs
      });
      setName('');
      setRut('');
    } catch (error) {
      alert("Hubo un error al guardar al trabajador.");
    }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas ELIMINAR a este trabajador?")) {
      await deleteDoc(doc(db, 'trabajadores', id));
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm("¿Reiniciar la contraseña a 'pass'?")) {
      await updateDoc(doc(db, 'trabajadores', id), { password: 'pass' });
      alert("Contraseña reiniciada.");
    }
  };

  // ==========================================
  // VISTA 1: LOGIN
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario (Correo Admin o RUT)</label>
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
  // VISTA 2: TRABAJADOR
  // ==========================================
  if (userRole === 'worker') {
    const docs = currentUser.documentos || [];
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Mi Perfil Flesan</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium text-sm sm:text-base">Cerrar Sesión</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">{currentUser.nombre}</h2>
          <p className="text-gray-500 mt-1">RUT: {currentUser.rut}</p>
        </div>

        {/* Mis Documentos */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Mis Documentos Legales</h3>
          {docs.length === 0 ? (
            <p className="text-gray-500 text-sm">No tienes documentos asignados aún.</p>
          ) : (
            <div className="space-y-3">
              {docs.map((doc, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-800">{doc.nombre}</p>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Ver / Descargar PDF</a>
                  </div>
                  <div>
                    {doc.firmado ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold uppercase">✅ Firmado</span>
                    ) : (
                      <button onClick={() => handleSignDocument(index)} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors font-medium">
                        Firmar Documento
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cambio de clave */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Cambiar Contraseña</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newPassword) return;
            try {
              await updateDoc(doc(db, 'trabajadores', currentUser.id), { password: newPassword });
              setPasswordMessage('¡Contraseña actualizada!');
              setNewPassword('');
            } catch (err) { setPasswordMessage('Error al actualizar.'); }
          }} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border border-gray-300 p-2 rounded w-full sm:w-64 focus:outline-none focus:border-blue-500" required />
            <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded font-medium hover:bg-gray-700 transition-colors">Actualizar</button>
          </form>
          {passwordMessage && <p className="mt-3 text-sm font-medium text-green-600">{passwordMessage}</p>}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 3: ADMINISTRADOR
  // ==========================================
  if (userRole === 'admin') {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Panel Administrador</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium">Cerrar Sesión</button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Nuevo Trabajador</h2>
          <form onSubmit={handleAddWorker} className="flex flex-wrap gap-4">
            <input type="text" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 p-2 rounded flex-1 min-w-[200px]" />
            <input type="text" placeholder="RUT (ej: 12.345.678-9)" value={rut} onChange={(e) => setRut(e.target.value)} className="border border-gray-300 p-2 rounded w-full sm:w-48" />
            <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded font-medium hover:bg-green-800">Guardar</button>
          </form>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Personal Registrado ({filteredWorkers.length})</h2>
            <input type="text" placeholder="Buscar por nombre o RUT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-72 border border-gray-300 p-2 rounded-lg" />
          </div>

          <div className="space-y-4">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-3 md:mb-0">
                    <p className="font-bold text-lg text-gray-800">{worker.nombre}</p>
                    <p className="text-gray-500 text-sm">RUT: {worker.rut}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Botón Mágico: Subir Archivo */}
                    <label className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer flex items-center">
                      {uploadingId === worker.id ? '⏳ Subiendo...' : '📄 Subir PDF'}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(worker.id, worker.documentos, e)} 
                        disabled={uploadingId === worker.id}
                      />
                    </label>
                    <button onClick={() => handleResetPassword(worker.id)} className="text-yellow-600 hover:bg-yellow-50 border border-yellow-200 px-3 py-1 rounded text-sm transition-colors" title="Restablecer clave a 'pass'">Reiniciar Clave</button>
                    <button onClick={() => handleDeleteWorker(worker.id)} className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded text-sm transition-colors">Borrar</button>
                  </div>
                </div>

                {/* Lista de Documentos Subidos para este trabajador */}
                {worker.documentos && worker.documentos.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Documentos asignados:</p>
                    <div className="space-y-2">
                      {worker.documentos.map((doc, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-200">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{doc.nombre}</a>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${doc.firmado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {doc.firmado ? 'FIRMADO' : 'PENDIENTE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {workers.length === 0 && <div className="text-center p-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">No hay trabajadores registrados.</div>}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
