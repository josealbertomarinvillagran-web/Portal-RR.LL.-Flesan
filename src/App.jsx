import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// COMPONENTE: PANEL DE DIBUJO DE FIRMA
// ==========================================
const SignaturePad = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = 200; 
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startPosition = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const endPosition = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-2 mb-4">
      <p className="text-sm text-gray-500 mb-2 font-medium">Dibuja tu firma aquí (Usa tu dedo o el mouse):</p>
      <canvas
        ref={canvasRef}
        onMouseDown={startPosition}
        onMouseUp={endPosition}
        onMouseMove={draw}
        onMouseLeave={endPosition}
        onTouchStart={startPosition}
        onTouchEnd={endPosition}
        onTouchMove={draw}
        className="w-full bg-blue-50 border border-blue-200 rounded cursor-crosshair touch-none"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={clearCanvas} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Limpiar</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">Cancelar</button>
        <button onClick={() => onSave(canvasRef.current.toDataURL('image/png'))} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Firma</button>
      </div>
    </div>
  );
};

export default function App() {
  const [userRole, setUserRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      const q = query(collection(db, 'trabajadores'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const workersArray = [];
        querySnapshot.forEach((doc) => {
          workersArray.push({ id: doc.id, ...doc.data() });
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

    if (loginId === 'admin@flesan.cl' && loginPass === 'admin') {
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
        }
      } else {
        setLoginError('Credenciales incorrectas o RUT no registrado.');
      }
    } catch (error) {
      setLoginError('Error de conexión.');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setLoginId('');
    setLoginPass('');
    setPasswordMessage('');
    setIsDrawingSignature(false);
  };

  // NUEVA FUNCIÓN: Descarga forzada usando JavaScript (Evita bloqueos de Cloudinary)
  const handleForceDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'documento_flesan.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al forzar descarga:", error);
      // Fallback por si la red falla
      window.open(url, '_blank');
    }
  };

  const handleFileUpload = async (workerId, currentDocs = [], event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(workerId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'documentos_flesan'); 
    
    try {
      // CAMBIO CLAVE: Usamos 'raw/upload' en lugar de 'auto/upload' para que Cloudinary no interfiera con el PDF
      const res = await fetch('https://api.cloudinary.com/v1_1/ki3o9nju/raw/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
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
      alert('Error al subir el documento.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteDocument = async (workerId, currentDocs, docIndex) => {
    if (window.confirm("¿Estás seguro de que deseas quitar este documento del perfil?")) {
      const updatedDocs = currentDocs.filter((_, index) => index !== docIndex);
      try {
        await updateDoc(doc(db, 'trabajadores', workerId), {
          documentos: updatedDocs
        });
        if (currentUser && currentUser.id === workerId) {
          setCurrentUser({ ...currentUser, documentos: updatedDocs });
        }
      } catch (error) {
        alert("Error al eliminar el documento.");
      }
    }
  };

  const handleSaveSignature = async (base64Image) => {
    try {
      await updateDoc(doc(db, 'trabajadores', currentUser.id), {
        firma: base64Image
      });
      setCurrentUser({ ...currentUser, firma: base64Image });
      setIsDrawingSignature(false);
      alert("¡Firma guardada correctamente!");
    } catch (error) {
      alert("Error al guardar la firma.");
    }
  };

  const handleSignDocument = async (docIndex) => {
    if (!currentUser.firma) {
      alert("Por favor, crea tu Firma Digital primero en la sección de arriba.");
      return;
    }
    if (!window.confirm("Al ACEPTAR, confirmas haber previsualizado el documento y autorizas aplicar tu firma digital con validez legal.")) return;

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

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!name || !rut) return;
    try {
      await addDoc(collection(db, 'trabajadores'), {
        nombre: name, rut: rut, fechaRegistro: new Date().toISOString(), estado: 'Al día', password: 'pass', documentos: []
      });
      setName(''); setRut('');
    } catch (error) { alert("Error al guardar."); }
  };
  
  const handleDeleteWorker = async (id) => {
    if (window.confirm("¿ELIMINAR a este trabajador? Todo su registro desaparecerá.")) await deleteDoc(doc(db, 'trabajadores', id));
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
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Ej: admin@flesan.cl o 12.345.678-9" className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500" required />
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
      <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Mi Perfil Flesan</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium text-sm sm:text-base">Cerrar Sesión</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{currentUser.nombre}</h2>
          <p className="text-gray-500 mt-1">RUT: {currentUser.rut}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Mi Firma Digital</h3>
          {isDrawingSignature ? (
            <SignaturePad onSave={handleSaveSignature} onCancel={() => setIsDrawingSignature(false)} />
          ) : currentUser.firma ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="border border-gray-200 bg-gray-50 rounded p-2">
                <img src={currentUser.firma} alt="Firma del trabajador" className="h-24 w-auto object-contain bg-transparent border-b border-blue-200" />
              </div>
              <div className="text-sm text-gray-500">
                <p>Esta es tu firma legal registrada.</p>
                <button onClick={() => setIsDrawingSignature(true)} className="mt-2 text-blue-600 font-medium hover:underline">Crear una nueva firma</button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-yellow-800 mb-3">Aún no tienes una firma digital registrada.</p>
              <button onClick={() => setIsDrawingSignature(true)} className="bg-yellow-500 text-white px-6 py-2 rounded font-medium hover:bg-yellow-600 transition-colors">Crear Firma Digital Ahora</button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Mis Documentos Legales</h3>
          {docs.length === 0 ? (
            <p className="text-gray-500 text-sm">No tienes documentos asignados aún.</p>
          ) : (
            <div className="space-y-4">
              {docs.map((doc, index) => (
                <div key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 border border-gray-200 rounded">
                  <div className="mb-4 md:mb-0 w-full md:w-1/2">
                    <p className="font-semibold text-gray-800 text-base">{doc.nombre}</p>
                    {!doc.firmado && <p className="text-xs text-gray-500 mt-1">Debes leer el documento antes de firmar.</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 border border-blue-300 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 font-medium">👁️ Ver Online</a>
                      <button onClick={() => handleForceDownload(doc.url, doc.nombre)} className="text-sm text-gray-700 border border-gray-300 bg-white px-3 py-1 rounded hover:bg-gray-100 font-medium">⬇️ Descargar PDF</button>
                    </div>
                  </div>
                  <div className="w-full md:w-auto mt-2 md:mt-0">
                    {doc.firmado ? (
                      <div className="text-left md:text-right">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-bold uppercase inline-block mb-1">✅ Documento Firmado</span>
                        <p className="text-xs text-gray-400">Fecha: {new Date(doc.fechaFirma).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <button onClick={() => handleSignDocument(index)} className="bg-blue-600 text-white px-5 py-2 rounded text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm w-full md:w-auto">Aplicar mi Firma</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 3: ADMINISTRADOR
  // ==========================================
  if (userRole === 'admin') {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto font-sans bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Panel Administrador</h1>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium">Cerrar Sesión</button>
        </div>

        <div className="bg-white p-6 rounded-lg mb-8 shadow-sm border border-gray-200">
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
                    {worker.firma && <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">✍️ Firma Registrada</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <label className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer flex items-center">
                      {uploadingId === worker.id ? '⏳ Subiendo...' : '📄 Subir PDF'}
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(worker.id, worker.documentos, e)} disabled={uploadingId === worker.id} />
                    </label>
                    <button onClick={() => handleDeleteWorker(worker.id)} className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded text-sm transition-colors">Borrar Trabajador</button>
                  </div>
                </div>

                {worker.documentos && worker.documentos.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Documentos asignados:</p>
                    <div className="space-y-2">
                      {worker.documentos.map((docItem, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm bg-white p-3 rounded border border-gray-200">
                          <div className="flex-1 truncate mb-2 sm:mb-0 mr-4">
                            <p className="font-medium text-gray-800">📄 {docItem.nombre}</p>
                            <div className="flex gap-3 mt-1">
                              <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">👁️ Ver</a>
                              <button onClick={() => handleForceDownload(docItem.url, docItem.nombre)} className="text-gray-600 hover:underline text-xs text-left">⬇️ Descargar</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${docItem.firmado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {docItem.firmado ? 'FIRMADO' : 'PENDIENTE'}
                            </span>
                            <button onClick={() => handleDeleteDocument(worker.id, worker.documentos, idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold px-3 py-1 rounded border border-transparent hover:border-red-200 transition-colors">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {workers.length === 0 && <div className="text-center p-8 text-gray-500 bg-white rounded border border-dashed border-gray-300">No hay trabajadores registrados.</div>}
          </div>
        </div>
      </div>
    );
  }
}
