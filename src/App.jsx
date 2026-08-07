import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, CheckCircle, AlertCircle, User, LogOut, 
  Download, Search, Upload, Plus, Trash2, AlertTriangle, 
  ChevronLeft, ChevronRight, FileSignature, FileUp,
  MessageCircle, Send, Key, Lock, ShieldCheck
} from 'lucide-react';

const getExpirationStatus = (dateString) => {
  if (!dateString) return { expired: false, warning: false, color: 'bg-gray-100 text-gray-800' };
  
  const expDate = new Date(dateString);
  const today = new Date();
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return { expired: true, warning: false, color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️', days: diffDays };
  if (diffDays <= 60) return { expired: false, warning: true, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️', days: diffDays };
  return { expired: false, warning: false, color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', days: diffDays };
};

const generateMockWorkers = () => {
  return [
    { id: 1, name: 'Erick Donay Astorga Celedon', rut: '7.174.411-6', cargo: 'Jefe de Disciplina Civil', signature: null, docs: [], password: 'pass' },
    { id: 2, name: 'Jorge Luis Rojas Aravena', rut: '7.405.831-0', cargo: 'Chofer y Servicios Generales', signature: null, docs: [], password: 'pass' },
    { id: 3, name: 'Raul Eduardo Alvarez Avendaño', rut: '8.609.745-1', cargo: 'Supervisor', signature: null, docs: [], password: 'pass' },
    { id: 4, name: 'Job Juan Alarcon Velasquez', rut: '8.736.515-8', cargo: 'Maestro de Primera Obras Civiles', signature: null, docs: [], password: 'pass' },
    { id: 5, name: 'Gonzalo Joaquin Barrientos Leon', rut: '8.748.382-7', cargo: 'Gestor de Contratos', signature: null, docs: [], password: 'pass' },
    { id: 6, name: 'Luis Orlando Daniel Llanes Salas', rut: '9.733.906-6', cargo: 'Maestro de Primera Obras Civiles', signature: null, docs: [], password: 'pass' },
    { id: 7, name: 'Jose Luis Duran Zamora', rut: '9.793.286-7', cargo: 'Supervisor', signature: null, docs: [], password: 'pass' },
    { id: 8, name: 'Patricio Armando Lara Barrales', rut: '10.016.167-2', cargo: 'Maestro de Primera Obras Civiles', signature: null, docs: [], password: 'pass' }
  ];
};

const handleDownloadDoc = (doc, worker) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = '';

    if (doc.originalPdfBase64) {
         content = `
            <div style="text-align: center; font-family: sans-serif; padding: 20px;">
                <h2>Documento Físico Original: ${doc.title}</h2>
                <p><strong>Trabajador:</strong> ${worker.name} (${worker.rut})</p>
                <div style="border: 2px solid #000; padding: 20px; margin-top: 20px; display: inline-block; text-align: left; background: #f9f9f9;">
                    <h3 style="color: #0033CC; margin-top:0;">Sello Digital Flesan</h3>
                    <p><strong>Firmante:</strong> ${worker.name}</p>
                    <p><strong>RUT:</strong> ${worker.rut}</p>
                    <p><strong>Fecha Autorización:</strong> ${doc.signDate || 'Pendiente'}</p>
                    <p><strong>Hash de Seguridad:</strong> <span style="font-family: monospace;">${doc.signatureHash || 'N/A'}</span></p>
                    ${worker.signature && doc.status === 'Firmado' ? `<img src="${worker.signature}" style="height: 100px; display: block; margin-top: 10px;" />` : '<p style="color:red; font-weight:bold;"><i>DOCUMENTO PENDIENTE DE FIRMA</i></p>'}
                </div>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">Nota: En la versión final, este sello se incrustará automáticamente en la última hoja del PDF original mediante la librería pdf-lib.</p>
            </div>
         `;
    } else {
        content = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #000;">
            <div style="margin-bottom: 20px;">
                <h1 style="font-size: 18px; margin: 0;">FLESAN MINERIA S.A.</h1>
                <p style="margin: 2px 0; font-size: 12px;">Rut: 76.727.168-9</p>
                <p style="margin: 2px 0; font-size: 12px;">Avenida Apoquindo # 6550 P. 10 LAS CONDES</p>
            </div>
            <h2 style="text-align: center; font-size: 16px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 10px;">${doc.title || doc.type}</h2>
            <table style="width: 100%; font-size: 12px; margin-bottom: 20px;">
                <tr><td style="width: 15%;"><strong>Nombre:</strong></td><td style="width: 35%;">${worker.name}</td><td style="width: 15%;"><strong>L. de trabajo:</strong></td><td style="width: 35%;">Area humeda Quebrada Blanca-Teck</td></tr>
                <tr><td><strong>RUT:</strong></td><td>${worker.rut}</td><td><strong>Cargo:</strong></td><td>${worker.cargo}</td></tr>
            </table>
            <div style="border: 2px solid #000; padding: 15px; margin-top: 40px; display: inline-block;">
                <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Firmante:</strong> ${worker.name}</p>
                <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>RUT:</strong> ${worker.rut}</p>
                ${doc.status === 'Firmado' ? `
                    <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Fecha Autorización:</strong> ${doc.signDate}</p>
                    <p style="margin: 0 0 10px 0; font-size: 12px;"><strong>Hash:</strong> <span style="font-family: monospace;">${doc.signatureHash}</span></p>
                    ${worker.signature ? `<img src="${worker.signature}" style="height: 100px; display: block;" />` : ''}
                ` : `<p style="margin: 0; font-size: 12px; color: red; font-weight: bold;">DOCUMENTO PENDIENTE DE FIRMA</p>`}
            </div>
        </div>
        `;
    }

    printWindow.document.write(`
        <html>
            <head><title>${doc.title} - ${worker.name}</title></head>
            <body style="margin: 0; padding: 0;" onload="setTimeout(() => { window.print(); window.close(); }, 500)">
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
};


const LoginView = ({ onLogin, workers }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanInput = rut.replace(/[^0-9kK]/g, '').toLowerCase();

    if (cleanInput === '111111111' && password === 'admin') {
      onLogin({ role: 'admin', name: 'Administrador RRHH' });
    } else {
      const worker = workers.find(w => w.rut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanInput);
      if (worker) {
        if (password === worker.password) {
            onLogin({ role: 'worker', id: worker.id, rut: worker.rut, name: worker.name });
        } else {
            setError('Contraseña incorrecta.');
        }
      } else {
        setError('RUT no encontrado en el sistema.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-4"><FileText className="w-16 h-16" /></div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Flesan RH</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Portal de Documentos Legales</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-200">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">RUT</label>
              <input type="text" required value={rut} onChange={(e) => setRut(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 19.376.886-5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition">
              Ingresar al Portal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ workers, setWorkers, setCurrentView, setSelectedWorker }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.rut.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddWorker = (e) => {
      e.preventDefault();
      const newWorker = {
          id: Date.now(), name: e.target.name.value, rut: e.target.rut.value, cargo: e.target.cargo.value,
          signature: null, docs: [], password: 'pass'
      };
      setWorkers([newWorker, ...workers]);
      setShowAddModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Directorio de Personal</h1>
          <p className="text-gray-600">Gestión documental de {workers.length} trabajadores</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button onClick={() => setCurrentView('mass_upload')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 shadow-sm">
                <Upload className="w-5 h-5" /> Carga Masiva
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm">
                <Plus className="w-5 h-5" /> Nuevo Personal
            </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        <input type="text" placeholder="Buscar por Nombre o RUT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map(w => {
            const pendingDocs = w.docs.filter(d => d.status === 'Pendiente').length;
            return (
              <div key={w.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">{w.name.charAt(0)}</div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-gray-900 truncate">{w.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{w.rut}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                    {pendingDocs > 0 ? (
                         <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {pendingDocs} Pendiente</span>
                    ) : (
                         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Al día</span>
                    )}
                </div>
                <button onClick={() => { setSelectedWorker(w); setCurrentView('worker_folder'); }} className="w-full text-center py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium">Abrir Carpeta</button>
              </div>
            );
        })}
      </div>

      {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <form onSubmit={handleAddWorker} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                  <h3 className="font-bold text-2xl text-gray-900 mb-4 flex items-center gap-2"><User/> Nuevo Trabajador</h3>
                  <div className="space-y-4 mb-6">
                      <div><label className="block text-sm font-medium mb-1">Nombre Completo</label><input name="name" required type="text" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium mb-1">RUT</label><input name="rut" required type="text" placeholder="Ej: 11.111.111-1" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-sm font-medium mb-1">Cargo</label><input name="cargo" required type="text" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  </div>
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Crear Cuenta</button>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};

const WorkerFolder = ({ workers, setWorkers, selectedWorker, setCurrentView }) => {
  const [docType, setDocType] = useState('Liquidación');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [openComments, setOpenComments] = useState(null);
  
  const worker = workers.find(w => w.id === selectedWorker.id);
  if (!worker) return null;

  const handleIssueDoc = (e) => {
    e.preventDefault();
    const newDoc = {
      id: 'doc_' + Date.now(), type: docType, title: e.target.title.value, date: new Date().toISOString().split('T')[0],
      expirationDate: docType !== 'Liquidación' && docType !== 'Anexo' ? e.target.expDate?.value || null : null, 
      status: 'Pendiente', originalPdfBase64: null, signatureHash: null, signDate: null, comments: []
    };
    setWorkers(workers.map(w => w.id === worker.id ? { ...w, docs: [newDoc, ...w.docs] } : w));
    e.target.reset();
  };

  const handleAddComment = (e, docId) => {
      e.preventDefault();
      const text = e.target.comment.value;
      if (!text.trim()) return;
      const newComment = { id: Date.now(), text, sender: 'admin', date: new Date().toLocaleString('es-CL'), author: 'RRHH' };
      setWorkers(workers.map(w => w.id === worker.id ? { ...w, docs: w.docs.map(d => d.id === docId ? { ...d, comments: [...(d.comments||[]), newComment] } : d) } : w));
      e.target.reset();
  };

  const pendingDocs = worker.docs.filter(d => d.status === 'Pendiente');
  const signedDocs = worker.docs.filter(d => d.status === 'Firmado');

  const renderDocRow = (doc, isPending) => (
      <div key={doc.id} className={`flex flex-col ${isPending ? 'hover:bg-orange-50' : 'hover:bg-green-50'} transition bg-white border-b border-gray-100 last:border-0`}>
          <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">{doc.title} {doc.originalPdfBase64 && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">PDF Físico</span>}</h4>
                  <div className="flex gap-2 items-center mt-1">
                      <p className="text-sm text-gray-500">Emitido: {doc.date}</p>
                      {doc.expirationDate && <span className={`text-xs px-2 py-0.5 rounded-full ${getExpirationStatus(doc.expirationDate).color}`}>Vence: {doc.expirationDate}</span>}
                  </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setOpenComments(openComments === doc.id ? null : doc.id)} className="relative p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1 font-medium text-sm">
                      <MessageCircle className="w-5 h-5"/> Consultas
                      {(doc.comments?.length > 0) && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow">{doc.comments.length}</span>}
                  </button>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${isPending ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{doc.status}</span>
                  <button onClick={() => handleDownloadDoc(doc, worker)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium flex items-center gap-2"><Download className="w-4 h-4"/> Descargar</button>
              </div>
          </div>
          {openComments === doc.id && (
              <div className="bg-gray-50 p-4 border-t border-gray-200 shadow-inner">
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                      {(doc.comments || []).length === 0 ? <p className="text-sm text-gray-500 italic">Sin mensajes.</p> :
                          doc.comments.map(c => (
                              <div key={c.id} className={`flex flex-col ${c.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${c.sender === 'admin' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                                      <p className="text-xs font-bold mb-1 opacity-75">{c.author}</p>
                                      <p className="text-sm leading-snug">{c.text}</p>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
                  <form onSubmit={(e) => handleAddComment(e, doc.id)} className="flex gap-2">
                      <input name="comment" type="text" placeholder="Responder..." required className="flex-1 rounded-xl border-gray-300 border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"><Send className="w-4 h-4"/></button>
                  </form>
              </div>
          )}
      </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <button onClick={() => setCurrentView('admin_dash')} className="text-blue-600 font-medium mb-4 flex items-center gap-1 hover:underline"><ChevronLeft className="w-4 h-4" /> Volver al Directorio</button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{worker.name}</h1>
            <p className="text-gray-500 text-lg">{worker.rut} • {worker.cargo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowResetModal(true)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-orange-100 transition border border-orange-200">
                <Key className="w-5 h-5"/> Resetear Clave
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-100 transition border border-red-200">
                <Trash2 className="w-5 h-5"/> Eliminar Trabajador
            </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6">
        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5"/> Emitir Documento Manual</h3>
        <form onSubmit={handleIssueDoc} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className={docType !== 'Liquidación' && docType !== 'Anexo' ? 'col-span-1' : 'col-span-2'}>
            <label className="block text-sm text-blue-800 mb-1 font-medium">Tipo</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option>Liquidación</option><option>Anexo</option><option>Certificado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-blue-800 mb-1 font-medium">Título Descriptivo</label>
            <input name="title" required type="text" placeholder="Ej: Liquidación Junio 2026" className="w-full border border-blue-200 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div><button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md transition">Asignar</button></div>
        </form>
      </div>

      <div className="space-y-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-200 font-bold text-orange-900 flex justify-between items-center">
            <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600"/> Acción Requerida: Pendientes de Firma</div>
            <span className="bg-orange-200 text-orange-800 py-0.5 px-3 rounded-full text-sm">{pendingDocs.length}</span>
          </div>
          <div className="flex flex-col">
            {pendingDocs.map(doc => renderDocRow(doc, true))}
            {pendingDocs.length === 0 && <p className="text-gray-500 text-center py-8 font-medium">No hay documentos pendientes.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-green-50 border-b border-green-200 font-bold text-green-900 flex justify-between items-center">
            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600"/> Historial de Firmados</div>
            <span className="bg-green-200 text-green-800 py-0.5 px-3 rounded-full text-sm">{signedDocs.length}</span>
          </div>
          <div className="flex flex-col">
            {signedDocs.map(doc => renderDocRow(doc, false))}
            {signedDocs.length === 0 && <p className="text-gray-500 text-center py-8 font-medium">Aún no hay documentos firmados.</p>}
          </div>
        </div>
      </div>

      {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 relative">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Key className="text-orange-600 w-8 h-8"/></div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">Restablecer Contraseña</h3>
                  <p className="text-sm text-gray-600 mb-6">La contraseña volverá a ser <strong>pass</strong>.</p>
                  <div className="flex gap-2">
                      <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition">Cancelar</button>
                      <button onClick={() => { setWorkers(workers.map(w => w.id === worker.id ? {...w, password: 'pass'} : w)); setShowResetModal(false); }} className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold shadow-md hover:bg-orange-700 transition">Restablecer</button>
                  </div>
              </div>
          </div>
      )}

      {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 relative">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-600 w-8 h-8"/></div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">¿Eliminar esta carpeta?</h3>
                  <p className="text-sm text-gray-600 mb-6">Se borrará permanentemente la cuenta de <strong>{worker.name}</strong>. No se puede deshacer.</p>
                  <div className="flex gap-2">
                      <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition">Cancelar</button>
                      <button onClick={() => { setWorkers(workers.filter(w => w.id !== worker.id)); setCurrentView('admin_dash'); }} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold shadow-md hover:bg-red-700 transition">Sí, Eliminar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const MassUploadView = ({ workers, setWorkers, setCurrentView }) => {
    const [uploadResult, setUploadResult] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
  
    const handlePDFUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      setIsUploading(true);
      
      let success = 0; let duplicate = 0; let error = 0;
      let newWorkers = [...workers];
  
      for (const file of files) {
          let rawName = file.name.replace('.pdf', '').trim();
          let cleanFileName = rawName.replace(/[^0-9kK]/g, '').toLowerCase();
          
          let wIndex = newWorkers.findIndex(w => w.rut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanFileName);
          
          if (wIndex === -1) {
              error++;
              continue;
          }
  
          const docTitle = `Liquidación Original Físico - ${rawName}`;
          const isDuplicate = newWorkers[wIndex].docs.some(d => d.title === docTitle);
  
          if (isDuplicate) {
              duplicate++;
          } else {
              const fileData = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.readAsDataURL(file);
              });
  
              const newDoc = {
                  id: 'doc_pdf_' + Date.now() + Math.random(), type: 'Liquidación Original', title: docTitle,
                  date: new Date().toISOString().split('T')[0], expirationDate: null, status: 'Pendiente',
                  originalPdfBase64: fileData, signatureHash: null, signDate: null, comments: []
              };
              newWorkers[wIndex] = { ...newWorkers[wIndex], docs: [newDoc, ...newWorkers[wIndex].docs] };
              success++;
          }
      }
      
      setWorkers(newWorkers);
      setIsUploading(false);
      setUploadResult({ success, duplicate, error });
      e.target.value = ''; 
    };
  
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setCurrentView('admin_dash')} className="text-blue-600 font-medium mb-6 flex items-center gap-1 hover:underline"><ChevronLeft className="w-4 h-4" /> Volver al Directorio</button>
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-800">Carga Masiva de Documentos</h1></div>
  
        {uploadResult && (
            <div className="bg-white p-6 rounded-2xl shadow border border-gray-200 mb-6 text-center animate-fade-in">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Resultado de la Carga</h3>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="text-green-600 font-bold flex flex-col items-center"><CheckCircle className="w-8 h-8 mb-1"/> {uploadResult.success} Emitidos</div>
                    <div className="text-orange-500 font-bold flex flex-col items-center"><AlertTriangle className="w-8 h-8 mb-1"/> {uploadResult.duplicate} Omitidos (Duplicados)</div>
                    <div className="text-red-600 font-bold flex flex-col items-center"><AlertCircle className="w-8 h-8 mb-1"/> {uploadResult.error} Fallidos (RUT no existe)</div>
                </div>
            </div>
        )}
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border-2 border-dashed border-blue-300 p-8 rounded-2xl text-center">
                <FileUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-blue-900 text-lg mb-2">Carga de Archivos Físicos (.PDF)</h3>
                <p className="text-sm text-blue-700 mb-6">Selecciona múltiples PDFs. El nombre de cada archivo debe ser el RUT del trabajador (ej. 7174411-6.pdf).</p>
                <input type="file" multiple accept=".pdf" id="pdfUpload" className="hidden" onChange={handlePDFUpload} disabled={isUploading} />
                <label htmlFor="pdfUpload" className={`inline-block w-full py-3 px-4 rounded-lg font-bold text-white shadow-md cursor-pointer transition ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isUploading ? 'Procesando Documentos...' : 'Seleccionar PDFs Originales'}
                </label>
            </div>
        </div>
      </div>
    );
};

const WorkerDashboard = ({ workers, setWorkers, currentUser }) => {
  const [tab, setTab] = useState('docs');
  const [activeSignDoc, setActiveSignDoc] = useState(null);
  const [openComments, setOpenComments] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const me = workers.find(w => w.id === currentUser.id);
  if (!me) return null;

  const handlePasswordChange = (e) => {
      e.preventDefault();
      const current = e.target.current.value;
      const newPwd = e.target.newPwd.value;
      const confirm = e.target.confirm.value;

      if (current !== me.password) { setPwdMsg({ type: 'error', text: 'La contraseña actual ingresada es incorrecta.' }); return; }
      if (newPwd !== confirm) { setPwdMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' }); return; }
      
      setWorkers(workers.map(w => w.id === me.id ? { ...w, password: newPwd } : w));
      setPwdMsg({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
      e.target.reset();
  };

  const handleAddComment = (e, docId) => {
      e.preventDefault();
      const text = e.target.comment.value;
      if (!text.trim()) return;
      const newComment = { id: Date.now(), text, sender: 'worker', date: new Date().toLocaleString('es-CL'), author: me.name };
      setWorkers(workers.map(w => w.id === me.id ? { ...w, docs: w.docs.map(d => d.id === docId ? { ...d, comments: [...(d.comments||[]), newComment] } : d) } : w));
      e.target.reset();
  };

  const signDocument = (docId, signatureDataUrl) => {
    const hash = Math.random().toString(36).substring(2, 15).toUpperCase() + Math.random().toString(36).substring(2, 15).toUpperCase();
    const now = new Date().toLocaleString('es-CL');
    setWorkers(workers.map(w => {
      if (w.id === me.id) {
        return { ...w, signature: signatureDataUrl, docs: w.docs.map(d => d.id === docId ? { ...d, status: 'Firmado', signatureHash: hash, signDate: now } : d) };
      }
      return w;
    }));
  };

  const startDrawing = (e) => {
      const canvas = canvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.lineTo(x, y); ctx.stroke();
  };

  const endDrawing = () => setIsDrawing(false);
  const clearCanvas = () => { if(canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };

  const saveSignature = () => {
      if(canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL('image/png');
          setWorkers(workers.map(w => w.id === me.id ? { ...w, signature: dataUrl } : w));
          if (activeSignDoc) {
              signDocument(activeSignDoc, dataUrl);
              setActiveSignDoc(null);
              setTab('docs');
          }
      }
  };

  useEffect(() => {
      if ((tab === 'config' || activeSignDoc) && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0033CC';
      }
  }, [tab, activeSignDoc]);

  const renderDocRow = (doc, isPending) => (
      <div key={doc.id} className={`flex flex-col ${isPending ? 'hover:bg-orange-50' : 'hover:bg-green-50'} transition bg-white border-b border-gray-100 last:border-0`}>
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">{doc.title} {doc.originalPdfBase64 && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">PDF Físico</span>}</h3>
                  <div className="flex gap-2 items-center mt-1">
                      <p className="text-gray-500 text-sm">Emisión: {doc.date}</p>
                  </div>
                  {!isPending && (
                      <div className="mt-3 text-sm text-gray-500 border-l-4 border-green-500 pl-3 bg-green-50 py-2 pr-2 rounded-r-lg">
                          <p className="font-bold text-green-800 mb-1">Firma legal autorizada el: {doc.signDate}</p>
                          <p className="font-mono text-xs">CÓDIGO HASH: {doc.signatureHash}</p>
                      </div>
                  )}
              </div>
              <div className="flex flex-wrap w-full md:w-auto gap-2">
                  <button onClick={() => setOpenComments(openComments === doc.id ? null : doc.id)} className="flex-1 md:flex-none p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition relative flex justify-center items-center gap-2 font-medium">
                      <MessageCircle className="w-5 h-5"/> Dudas
                      {(doc.comments?.length > 0) && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md border-2 border-white">{doc.comments.length}</span>}
                  </button>
                  {isPending ? (
                      <button onClick={() => { if(me.signature) { signDocument(doc.id, me.signature); } else { setActiveSignDoc(doc.id); } }} className="flex-1 md:w-48 bg-orange-500 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-orange-600 flex justify-center items-center gap-2 transition">
                          <FileSignature className="w-5 h-5"/> Firmar Legalmente
                      </button>
                  ) : (
                      <button onClick={() => handleDownloadDoc(doc, me)} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 shadow flex items-center gap-2 justify-center transition"><Download className="w-5 h-5" /> Descargar PDF</button>
                  )}
              </div>
          </div>
          {openComments === doc.id && (
              <div className="bg-gray-50 p-4 border-t border-gray-200 shadow-inner">
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                      {(doc.comments || []).length === 0 ? <p className="text-sm text-gray-500 italic">¿Tienes alguna duda con tu pago? Escríbela aquí.</p> :
                          doc.comments.map(c => (
                              <div key={c.id} className={`flex flex-col ${c.sender === 'worker' ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${c.sender === 'worker' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                                      <p className="text-xs font-bold mb-1 opacity-75">{c.author}</p>
                                      <p className="text-sm leading-snug">{c.text}</p>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
                  <form onSubmit={(e) => handleAddComment(e, doc.id)} className="flex gap-2">
                      <input name="comment" type="text" placeholder="Escribe tu duda aquí..." required className="flex-1 rounded-xl border-gray-300 border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"><Send className="w-4 h-4"/></button>
                  </form>
              </div>
          )}
      </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border">
        <button onClick={() => setTab('docs')} className={`flex-1 py-3 rounded-lg font-bold transition ${tab === 'docs' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}>Mis Documentos</button>
        <button onClick={() => setTab('config')} className={`flex-1 py-3 rounded-lg font-bold transition ${tab === 'config' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}>Mi Firma Digital</button>
        <button onClick={() => setTab('security')} className={`flex-1 py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 ${tab === 'security' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}><ShieldCheck className="w-5 h-5"/> Seguridad</button>
      </div>

      {tab === 'docs' && !activeSignDoc && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="p-4 bg-orange-50 border-b border-orange-200 font-bold text-orange-900 flex items-center justify-between gap-2">
               <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" /> <span>Pendientes de Firma</span></div>
            </div>
            <div className="flex flex-col">{me.docs.filter(d => d.status === 'Pendiente').map(doc => renderDocRow(doc, true))}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="p-4 bg-green-50 border-b border-green-200 font-bold text-green-900 flex items-center justify-between gap-2">
               <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> <span>Historial de Aprobados</span></div>
            </div>
            <div className="flex flex-col">{me.docs.filter(d => d.status === 'Firmado').map(doc => renderDocRow(doc, false))}</div>
          </div>
        </div>
      )}

      {(tab === 'config' || activeSignDoc) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuración de Firma Legal</h2>
            
            {me.signature && tab === 'config' && !activeSignDoc ? (
                <div>
                    <div className="border-2 border-dashed border-green-300 rounded-xl p-4 bg-green-50 max-w-md mx-auto mb-6">
                        <img src={me.signature} alt="Firma" className="max-h-32 mx-auto" />
                        <p className="text-green-700 font-bold mt-2"><CheckCircle className="w-5 h-5 inline"/> Firma Guardada</p>
                    </div>
                    <button onClick={() => setWorkers(workers.map(w => w.id === me.id ? {...w, signature: null} : w))} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition">Volver a Dibujar Firma</button>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="border-2 border-blue-400 rounded-xl overflow-hidden bg-white shadow-inner mb-4 relative" style={{ touchAction: 'none' }}>
                        <canvas ref={canvasRef} width={400} height={200} className="w-full bg-blue-50/30 cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseOut={endDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}></canvas>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clearCanvas} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Borrar</button>
                        <button onClick={saveSignature} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">{activeSignDoc ? 'Firmar Documento' : 'Guardar Firma'}</button>
                    </div>
                </div>
            )}
        </div>
      )}

      {tab === 'security' && !activeSignDoc && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-lg mx-auto text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="text-blue-600 w-8 h-8"/></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Cambiar Contraseña</h2>
              {pwdMsg && <div className={`mb-4 p-3 rounded-lg font-medium text-sm border ${pwdMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{pwdMsg.text}</div>}
              <form onSubmit={handlePasswordChange} className="space-y-4 text-left">
                  <div><label className="block text-sm font-medium mb-1">Contraseña Actual</label><input type="password" name="current" required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Nueva Contraseña</label><input type="password" name="newPwd" required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm font-medium mb-1">Confirmar Nueva Contraseña</label><input type="password" name="confirm" required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4"><Lock className="w-5 h-5"/> Actualizar Contraseña</button>
              </form>
          </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [currentView, setCurrentView] = useState('admin_dash');
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => { setWorkers(generateMockWorkers()); }, []);

  const handleLogout = () => { setCurrentUser(null); setCurrentView('admin_dash'); setSelectedWorker(null); };

  if (!currentUser) return <LoginView onLogin={setCurrentUser} workers={workers} />;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <FileText className="w-8 h-8" />
            <span className="font-bold text-xl hidden sm:inline">Flesan RH Documentos</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{currentUser.name || currentUser.rut}</p>
              <p className="text-xs text-gray-500 uppercase">{currentUser.role === 'admin' ? 'Recursos Humanos' : 'Portal Empleado'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="py-6">
          {currentUser.role === 'admin' && currentView === 'admin_dash' && <AdminDashboard workers={workers} setWorkers={setWorkers} setCurrentView={setCurrentView} setSelectedWorker={setSelectedWorker} />}
          {currentUser.role === 'admin' && currentView === 'worker_folder' && <WorkerFolder workers={workers} setWorkers={setWorkers} selectedWorker={selectedWorker} setCurrentView={setCurrentView} />}
          {currentUser.role === 'admin' && currentView === 'mass_upload' && <MassUploadView workers={workers} setWorkers={setWorkers} setCurrentView={setCurrentView} />}
          {currentUser.role === 'worker' && <WorkerDashboard workers={workers} setWorkers={setWorkers} currentUser={currentUser} />}
      </main>
    </div>
  );
}
