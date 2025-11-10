import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css'; // <-- ¡IMPORTANTE! IMPORTA EL CSS

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// URL de tu API (backend)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// --- CÓDIGO DE EJEMPLO (AHORA GLOBAL) ---
const CODIGO_INEFICIENTE_EJEMPLO = `import time

print("--- Iniciando Script Ineficiente ---")
lista = []
for i in range(1000000):
    lista.append(i)

# Abrir un archivo sin 'with' (mala práctica)
f = open("test.txt", "w")
f.write("test")
f.close()

print("--- Script Terminado ---")
`;

// --- Componente Helper para los Badges de Prioridad ---
const PriorityBadge = ({ prioridad }) => {
  let className = 'badge ';
  if (prioridad === 'Alta') className += 'badge-high';
  else if (prioridad === 'Media') className += 'badge-medium';
  else className += 'badge-low';
  
  return <span className={className}>{prioridad}</span>;
};

// --- Pestaña para HU-001: Requisitos ---
function RequisitosTab() {
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('Alta');
  const [requisitos, setRequisitos] = useState([]);
  const [error, setError] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [editingReq, setEditingReq] = useState(null);

  const cargarRequisitos = async () => {
    // Usamos el proyecto_id=1 hardcodeado
    const res = await axios.get(`${API_URL}/api/requisitos/1`);
    setRequisitos(res.data);
  };

  useEffect(() => {
    cargarRequisitos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setReporte(null);

    if (!descripcion) {
      setError('El campo "Descripción" es requerido.');
      return; 
    }

    try {
      await axios.post(`${API_URL}/api/requisitos`, {
        descripcion,
        prioridad,
        proyecto_id: 1, // Hardcodeado
      });
      setDescripcion('');
      setPrioridad('Alta');
      cargarRequisitos();
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Error al guardar el requisito.");
      }
    }
  };

  const handleGenerarReporte = async () => {
    setError(null);
    try {
      // Usamos el proyecto_id=1 hardcodeado
      const res = await axios.get(`${API_URL}/api/requisitos/reporte/1`);
      setReporte(res.data);
    } catch (error) {
      setError("Error al generar el reporte.");
    }
  };

  const handleEditClick = (req) => {
    setEditingReq({ ...req }); 
    setError(null);
    setReporte(null);
  };

  const handleCancelEdit = () => {
    setEditingReq(null);
  };

  const handleUpdate = async (req_id) => {
    if (!editingReq.descripcion) {
      setError("La descripción no puede estar vacía.");
      return;
    }
    
    try {
      await axios.put(`${API_URL}/api/requisitos/${req_id}`, {
        descripcion: editingReq.descripcion,
        prioridad: editingReq.prioridad
      });
      setEditingReq(null);
      cargarRequisitos();
    } catch (error) {
      setError("Error al actualizar el requisito.");
    }
  };
  
  const handleDelete = async (req_id) => {
    if (window.confirm("¿Seguro que quieres eliminar este requisito?")) {
      try {
        await axios.delete(`${API_URL}/api/requisitos/${req_id}`);
        cargarRequisitos();
      } catch (error) {
        setError("Error al eliminar el requisito.");
      }
    }
  };

  // El JSX de RequisitosTab no cambia
  return (
    <div className="Tab-container">
      <h3>Recopilación de Requisitos con Métricas Energéticas</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Descripción del Requisito:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el requisito funcional de la aplicación..."
            rows="4"
          ></textarea>
        </div>
        <div className="form-group">
          <label>Prioridad:</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
        
        <button type="submit" className="btn btn-green">
          ✔ Validar y Agregar
        </button>
        
        <button type="button" onClick={handleGenerarReporte} className="btn btn-priority-medium" style={{marginLeft: '10px'}}>
          📊 Generar Reporte
        </button>
      </form>
      
      {error && <div className="form-error">{error}</div>}
      
      {reporte && (
        <div className="report-box">
          <h4>Reporte Preliminar de Impacto Ambiental</h4>
          <p>
            Impacto Total Proyectado: <strong>{reporte.total_kwh_proyectado.toFixed(3)} kWh</strong>
          </p>
          <p>
            Basado en <strong>{reporte.total_requisitos}</strong> requisitos.
          </p>
        </div>
      )}

      <hr />
      <h4>Vista Previa de Requisitos</h4>
      <ul className="requisitos-list">
        {requisitos.map((req) => (
          <li key={req.id}>
          
            {editingReq && editingReq.id === req.id ? (
              // --- MODO EDICIÓN ---
              <div className="req-edit-mode">
                <input
                  type="text"
                  value={editingReq.descripcion}
                  onChange={(e) => setEditingReq({...editingReq, descripcion: e.target.value})}
                  className="req-edit-input"
                />
                <select
                  value={editingReq.prioridad}
                  onChange={(e) => setEditingReq({...editingReq, prioridad: e.target.value})}
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <div className="req-actions">
                  <button onClick={() => handleUpdate(req.id)} className="btn-save">Guardar</button>
                  <button onClick={handleCancelEdit} className="btn-cancel">Cancelar</button>
                </div>
              </div>
            ) : (
              // --- MODO VISTA ---
              <>
                <span>
                  {req.descripcion} <br />
                  <small style={{ color: 'var(--text-light-secondary)' }}>
                    {/* Corrección de 'kwh_estimado' que puede ser null/undefined */}
                    Estimado: {req.kwh_estimado ? req.kwh_estimado.toFixed(2) : 'N/A'} kWh
                  </small>
                </span>
                <div className="req-actions">
                  <PriorityBadge prioridad={req.prioridad} />
                  <button onClick={() => handleEditClick(req)} className="btn-edit">Editar</button>
                  <button onClick={() => handleDelete(req.id)} className="btn-delete">X</button>
                </div>
              </>
            )}
            
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Pestaña para HU-002: Arquitectura ---
// *** MODIFICADO ***
function ArquitecturaTab({ setCodigo, setArquitecturaId, setCodigoId, setTab }) {
  const editorRef = useRef(null);
  
  const [impactoProyectado, setImpactoProyectado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // *** NUEVO ESTADO ***
  const [arquitecturaIdLocal, setArquitecturaIdLocal] = useState(null);

  useEffect(() => {
    if (!editorRef.current) {
      const editor = grapesjs.init({
        container: '#gjs',
        fromElement: true,
        plugins: [gjsPresetWebpage],
        storageManager: false,
        width: 'auto',
        height: '60vh',
      });
      
      const blockManager = editor.Blocks;
      blockManager.add('eco-image-loader', {
        label: 'Eco Image Loader',
        content: '<div data-gjs-type="eco-image-loader" style="padding:10px; border:2px dashed #22C55E;">Eco Image</div>',
        category: 'Eco-Eficiente',
        attributes: { class:'gjs-block-eco' }
      });
      blockManager.add('eco-video-player', {
        label: 'Eco Video Player',
        content: '<div data-gjs-type="eco-video-player" style="padding:10px; border:2px dashed #22C55E;">Eco Video</div>',
        category: 'Eco-Eficiente',
        attributes: { class:'gjs-block-eco' }
      });
      
      editorRef.current = editor;
    }
  }, []);

  const handleSugerir = async () => {
    setImpactoProyectado(null);
    try {
      const res = await axios.get(`${API_URL}/api/componentes/sugerir`);
      setSugerencias(res.data);
    } catch (error) {
      console.error("Error al sugerir componentes:", error);
      setSugerencias([]);
    }
  };

  // *** MODIFICADO ***
  const handleCalcularImpacto = async () => {
    if (!editorRef.current) return;
    setSugerencias([]);
    setIsLoading(true);

    const components = editorRef.current.getComponents();
    
    const getAllTypes = (comps) => {
      let types = [];
      comps.forEach(comp => {
        const type = comp.get('type') !== 'default' ? comp.get('type') : comp.get('tagName');
        types.push(type);
        if (comp.components().length > 0) {
          types = types.concat(getAllTypes(comp.components()));
        }
      });
      return types;
    };

    const componentList = getAllTypes(components);
    
    try {
      // Ahora esto guarda en BBDD y devuelve el ID
      const res = await axios.post(`${API_URL}/api/arquitectura/calcular_impacto`, {
        componentes: componentList
      });
      setImpactoProyectado(res.data.total_kwh_proyectado);
      
      // *** NUEVO ***
      // Guardamos el ID de la arquitectura creada
      setArquitecturaId(res.data.arquitectura_id); // Actualiza estado en App
      setArquitecturaIdLocal(res.data.arquitectura_id); // Actualiza estado local
      
    } catch (error) {
      console.error("Error al calcular impacto:", error);
    }
    setIsLoading(false);
  };
  
  // *** NUEVA FUNCIÓN (FLUJO LOW-CODE) ***
  const handleGenerarCodigo = async () => {
    if (!editorRef.current || !arquitecturaIdLocal) {
        alert("Primero debe 'Calcular Impacto' para guardar una arquitectura.");
        return;
    }
    setIsLoading(true);
    
    // 1. Obtenemos el código de GrapesJS
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    const codigo_generado = `\n<style>\n${css}\n</style>\n${html}`;
    
    try {
        // 2. Enviamos el código al nuevo endpoint
        const res = await axios.post(`${API_URL}/api/codigo/generar`, {
            arquitectura_id: arquitecturaIdLocal,
            script: codigo_generado
        });
        
        // 3. Actualizamos el estado global en App.js
        setCodigo(res.data.script); // Pone el HTML/CSS en el editor
        setCodigoId(res.data.codigo_id); // Establece el ID del código
        
        // 4. Cambiamos de pestaña
        setTab('optimizador');
        
    } catch (error) {
        console.error("Error al generar código:", error);
        alert("Error al generar código.");
    }
    setIsLoading(false);
  };

  return (
    <div className="Tab-container">
      <h3>Pantalla de Diseño de Arquitectura Low-Code</h3>
      
      <div className="architecture-controls">
        <button onClick={handleSugerir} className="btn btn-purple" disabled={isLoading}>
          ✨ 1. Sugerir Componentes (IA)
        </button>
        <button onClick={handleCalcularImpacto} className="btn btn-green" disabled={isLoading}>
          ⚡ 2. Calcular Impacto (Guardar)
        </button>
        
        {/* --- NUEVO BOTÓN --- */}
        <button 
          onClick={handleGenerarCodigo} 
          className="btn btn-priority-medium" 
          disabled={!arquitecturaIdLocal || isLoading}
          title={!arquitecturaIdLocal ? "Debe 'Calcular Impacto' primero" : "Generar código y pasar a optimización"}
        >
          ♻️ 3. Generar Código y Optimizar
        </button>
      </div>

      {impactoProyectado !== null && (
        <div className="impact-result">
          Impacto Proyectado: <strong>{impactoProyectado.toFixed(3)} kWh</strong>
          (Arquitectura ID: {arquitecturaIdLocal})
        </div>
      )}
      
      {sugerencias.length > 0 && (
        <div className="suggestions-box">
          <h4>Sugerencias Eco-Eficientes (IA):</h4>
          <ul>
            {sugerencias.map(sug => (
              <li key={sug.tipo}>
                <strong>{sug.nombre} ({sug.tipo})</strong>: {sug.kwh} kWh 
                (Alternativa a: <em>{sug.alternativa_a}</em>)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div id="gjs"></div>
    </div>
  );
}

// --- Pestaña para HU-003: Optimizador ---
// *** MODIFICADO ***
function OptimizadorTab({ codigo, setCodigo, codigoId }) {
  const [resultado, setResultado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Deshabilitar botones si no hay códigoId
  const isDisabled = !codigoId;

  const clearResults = () => {
    setResultado(null);
    setSugerencias([]);
    setError(null);
  }

  const handleRestablecerEjemplo = () => {
    clearResults();
    // Nota: Esto rompe el flujo de BBDD, es solo para demo
    alert("Ejemplo restablecido. Para usar la optimización real, genere código desde la pestaña 'Arquitectura'.");
    setCodigo(CODIGO_INEFICIENTE_EJEMPLO); 
  }

  // *** MODIFICADO ***
  const handleAnalizar = async () => {
    clearResults();
    setIsLoading(true);
    setResultado('Analizando (CodeCarbon Real)...');
    try {
      const res = await axios.post(`${API_URL}/api/codigo/analizar`, {
        codigo,
        codigo_id: codigoId // Envía el ID del código
      });
      setResultado(
        `Análisis (Real) completado:\n  Emisiones CO2: ${res.data.emisiones_co2.toFixed(6)} kg\n  Consumo CPU: ${res.data.consumo_cpu.toFixed(5)} %`
      );
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error en el análisis.');
      }
      setResultado(null);
    }
    setIsLoading(false);
  };

  // *** MODIFICADO ***
  const handleOptimizar = async () => {
    clearResults();
    setIsLoading(true);
    setResultado('Optimizando con IA (Ollama)...');
    try {
      const res = await axios.post(`${API_URL}/api/codigo/optimizar`, {
        codigo,
        codigo_id: codigoId // Envía el ID
      });
      
      setCodigo(res.data.nuevo_codigo); // Actualiza con el código de Ollama
      
      const r = res.data.resultado;
      setResultado(
        `¡OPTIMIZADO POR IA! (Medición Real)\n  Nuevas Emisiones CO2: ${r.emisiones_co2.toFixed(6)} kg\n  Nuevo Consumo CPU: ${r.consumo_cpu.toFixed(5)} %`
      );
    } catch (err) {
       if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error en la optimización.');
      }
      setResultado(null);
    }
    setIsLoading(false);
  }
  
  // *** MODIFICADO ***
  const handleSugerir = async () => {
    clearResults();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/codigo/sugerir`, {
        codigo,
        // (sugerir no necesita codigo_id ya que no guarda métricas)
      });
      // La API ahora devuelve [{sugerencia: "texto"}, ...]
      setSugerencias(res.data.sugerencias); 
    } catch (err) {
      setError('Error al obtener sugerencias.');
    }
    setIsLoading(false);
  }

  return (
    <div className="Tab-container">
      <h3>Pantalla de Generación y Optimización de Código con IA</h3>
      
      {isDisabled && (
        <div className="form-error" style={{textAlign: 'center', fontWeight: 'bold'}}>
          Para activar este panel, primero debe "Calcular Impacto" y "Generar Código" en la pestaña de "Diseño de Arquitectura".
        </div>
      )}
      
      <div className="code-controls">
        <button onClick={handleRestablecerEjemplo} className="btn btn-priority-high">
          1. Restablecer Ejemplo (Demo)
        </button>
        <button onClick={handleOptimizar} className="btn btn-purple" disabled={isDisabled || isLoading}>
          2. Optimizar Código (IA Real)
        </button>
        <button onClick={handleAnalizar} className="btn btn-green" disabled={isDisabled || isLoading}>
          3. Validar Eficiencia (Real)
        </button>
        <button onClick={handleSugerir} className="btn btn-priority-medium" disabled={isLoading}>
          4. Sugerir Mejoras (IA Real)
        </button>
      </div>

      <div className="form-group">
        <label>Editor de Código (Python / HTML) - (ID de Código: {codigoId || "Ninguno"})</label>
        <textarea
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          rows="15"
          style={{fontFamily: 'Courier New', 'fontSize': '1rem'}}
          readOnly={isDisabled} // No se puede editar si no hay ID
        ></textarea>
      </div>

      {error && <div className="form-error">{error}</div>}

      {resultado && (
        <pre className="optimizer-result">{resultado}</pre>
      )}
      
      {sugerencias.length > 0 && (
        <div className="suggestions-box" style={{marginTop: '15px'}}>
          <h4>Sugerencias de la IA (Ollama):</h4>
          <ul>
            {sugerencias.map((sug, index) => (
              <li key={index}>
                {sug.sugerencia}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Pestaña para HU-004: PRUEBAS ---
// *** MODIFICADO ***
function PruebasTab({ codigo, codigoId }) { 
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isDisabled = !codigoId;

  // *** MODIFICADO ***
  const handleEjecutarPruebas = async () => {
    setError(null);
    setReporte(null);
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/api/pruebas/ejecutar`, {
        codigo,
        codigo_id: codigoId // Envía el ID
      });
      setReporte(res.data);
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al ejecutar las pruebas.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="Tab-container">
      <h3>Ejecución de Pruebas con Evaluación Energética</h3>
      
      {isDisabled && (
        <div className="form-error" style={{textAlign: 'center', fontWeight: 'bold'}}>
          Para activar este panel, primero debe "Generar Código" en la pestaña de "Diseño de Arquitectura".
        </div>
      )}
      
      <p>
        El código del editor (ID: {codigoId || "Ninguno"}) se usará para ejecutar las pruebas.
      </p>
      <button onClick={handleEjecutarPruebas} className="btn btn-green" disabled={isDisabled || isLoading}>
        {isLoading ? "Ejecutando..." : "▶️ Ejecutar Pruebas (CodeCarbon Real)"}
      </button>

      {error && <div className="form-error">{error}</div>}

      {reporte && (
        <div className={`report-box-pruebas ${reporte.pasaron ? 'report-success' : 'report-fail'}`}>
          <h4>{reporte.pasaron ? '✔ PRUEBAS SUPERADAS' : '❌ PRUEBAS FALLIDAS'}</h4>
          <p>{reporte.mensaje}</p>

          {reporte.alerta_pico && (
            <div className="form-error" style={{marginTop: '10px'}}>
              <strong>Alerta de Ineficiencia:</strong> {reporte.alerta_pico}
            </div>
          )}
          
          <hr />
          
          <h4>Métricas de Consumo (Reales)</h4>
          <p>
            Emisiones CO2 (durante la prueba): <strong>{reporte.metricas.emisiones_co2.toFixed(6)} kg</strong>
          </p>
          <p>
            Consumo CPU (estimado): <strong>{reporte.metricas.consumo_cpu.toFixed(5)} %</strong>
          </p>

          <hr />

          <h4>Reporte Comparativo (Simulado)</h4>
          <p>
            Reducción de CO2 (vs. método tradicional): <strong>{reporte.reduccion_comparativa}</strong>
          </p>
        </div>
      )}
    </div>
  );
}


// --- Pestaña para HU-005: Dashboard ---
const UMBRAL_PICO_CO2 = 0.0003; 

function DashboardTab() {
  const [chartData, setChartData] = useState(null);
  const [alerta, setAlerta] = useState(null);
  
  // *** MODIFICADO ***
  const cargarMetricas = async () => {
    setAlerta(null); 
    // Ahora las métricas se obtienen con el JOIN complejo desde el proyecto 1
    const { data } = await axios.get(`${API_URL}/api/metricas/1`);

    if (data.labels.length === 0) {
        setAlerta("No hay métricas en la base de datos. Genere análisis en las pestañas 'Codificación' o 'Pruebas'.");
        setChartData(null); // Limpia el gráfico
        return;
    }

    const picosDetectados = data.data_co2.filter(val => val > UMBRAL_PICO_CO2);
    if (picosDetectados.length > 0) {
      setAlerta(
        `¡PICO DETECTADO! Se ${picosDetectados.length > 1 ? 'detectaron' : 'detectó'} ${picosDetectados.length} ${picosDetectados.length > 1 ? 'análisis' : 'análisis'} que superan el umbral de ${UMBRAL_PICO_CO2.toFixed(5)} kg CO2.`
      );
    }
    
    const benchmarkData = Array(data.labels.length).fill(UMBRAL_PICO_CO2);
    
    setChartData({
      labels: data.labels,
      datasets: [
        {
          label: 'Emisiones CO2 (kg) (Real)',
          data: data.data_co2,
          borderColor: 'var(--accent-green)', 
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          tension: 0.1
        },
        {
          label: 'Consumo CPU (Estimado) (%)',
          data: data.data_cpu,
          borderColor: 'var(--accent-purple)', 
          backgroundColor: 'rgba(168, 85, 247, 0.3)',
          tension: 0.1
        },
        {
          label: 'Benchmark Eco-Eficiente',
          data: benchmarkData,
          borderColor: 'var(--priority-high)',
          backgroundColor: 'rgba(249, 115, 22, 0.3)',
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 0
        }
      ],
    });
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        ticks: { color: 'var(--text-light-secondary)' },
        grid: { color: '#64748B' }
      },
      x: {
        ticks: { color: 'var(--text-light-secondary)' },
        grid: { color: '#64748B' }
      }
    },
    plugins: {
      legend: {
        labels: { color: 'var(--text-light-primary)' }
      }
    }
  };

  const handleExportar = () => {
    const reduccionEstimada = "92.5%";
    window.alert(
      `REPORTE EXPORTADO (Simulación)\n\n` +
      `Estimación de Reducción de CO2: ${reduccionEstimada}\n` +
      `Picos detectados: ${alerta ? 'Sí' : 'No'}\n` +
      `Total de análisis en BBDD: ${chartData ? chartData.labels.length : 0}`
    );
  };
  
  // Cargar métricas al montar el componente
  useEffect(() => {
    cargarMetricas();
  }, []);

  return (
    <div className="Tab-container">
      <h3>Dashboard de Métricas Ambientales (IA)</h3>
      <div className="code-controls">
        <button onClick={cargarMetricas} className="btn btn-green">
          Actualizar Dashboard (Cargar datos BBDD)
        </button>
        <button onClick={handleExportar} className="btn btn-priority-medium">
          Exportar Reporte
        </button>
      </div>

      <div className="dashboard-container">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p style={{textAlign: 'center', fontStyle: 'italic'}}>Presiona "Actualizar" para cargar los datos de la BBDD.</p>
        )}
      </div>

      <p className="dashboard-info">
        La línea naranja punteada representa el "Benchmark Eco-Eficiente".
      </p>

      {alerta && (
        <div className={picosDetectados.length > 0 ? "dashboard-alert" : "dashboard-info"}>
          <strong>Info:</strong> {alerta}
        </div>
      )}
    </div>
  );
}

// --- Pestaña para HU-006: REFACTORIZACIÓN ---
// *** MODIFICADO ***
function RefactorizacionTab({ codigo, setCodigo, codigoId }) {
  const [resultado, setResultado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isDisabled = !codigoId;

  const clearResults = () => {
    setResultado(null);
    setSugerencias([]);
    setError(null);
  }

  // Criterio 1: Proporcionar sugerencias (IA Real)
  const handleSugerir = async () => {
    clearResults();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/codigo/sugerir`, {
        codigo,
      });
      setSugerencias(res.data.sugerencias);
    } catch (err) {
      setError('Error al obtener sugerencias.');
    }
    setIsLoading(false);
  }

  // Criterio 3: Eliminar estructuras ineficientes (IA Real)
  const handleOptimizar = async () => {
    clearResults();
    setIsLoading(true);
    setResultado('Refactorizando con IA (Ollama)...');
    try {
      const res = await axios.post(`${API_URL}/api/codigo/optimizar`, {
        codigo,
        codigo_id: codigoId
      });
      setCodigo(res.data.nuevo_codigo); 
      const r = res.data.resultado;
      setResultado(
        `¡Refactorización automática (Real) completada!\n  Nuevas Emisiones CO2: ${r.emisiones_co2.toFixed(6)} kg\n  Nuevo Consumo CPU: ${r.consumo_cpu.toFixed(5)} %`
      );
    } catch (err) {
       if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error en la optimización.');
      }
      setResultado(null);
    }
    setIsLoading(false);
  }

  // Criterio 2: Validar mejora (CodeCarbon Real)
  const handleAnalizar = async () => {
    clearResults();
    setIsLoading(true);
    setResultado('Validando mejora (CodeCarbon Real)...');
    try {
      const res = await axios.post(`${API_URL}/api/codigo/analizar`, {
        codigo,
        codigo_id: codigoId
      });
      setResultado(
        `Validación (Real) completada:\n  Emisiones CO2: ${res.data.emisiones_co2.toFixed(6)} kg\n  Consumo CPU: ${res.data.consumo_cpu.toFixed(5)} %`
      );
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error en el análisis.');
      }
      setResultado(null);
    }
    setIsLoading(false);
  };


  return (
    <div className="Tab-container">
      <h3>Refactorización de Código con Sugerencias IA (HU-006)</h3>
      {isDisabled && (
        <div className="form-error" style={{textAlign: 'center', fontWeight: 'bold'}}>
          Para activar este panel, primero debe "Generar Código" en la pestaña de "Diseño de Arquitectura".
        </div>
      )}
      <p>
        Este panel usa IA real (Ollama) y mediciones reales (CodeCarbon).
        El impacto mejorado se registra automáticamente en la BBDD (visible en el Dashboard).
      </p>
      
      <div className="code-controls">
        <button onClick={handleSugerir} className="btn btn-purple" disabled={isLoading}>
          1. Proporcionar Sugerencias (IA)
        </button>
         <button onClick={handleOptimizar} className="btn btn-priority-high" disabled={isDisabled || isLoading}>
          3. Refactorizar (IA Auto)
        </button>
        <button onClick={handleAnalizar} className="btn btn-green" disabled={isDisabled || isLoading}>
          2. Validar Mejora (Medir)
        </button>
      </div>

      <div className="form-group">
        <label>Editor de Código (ID de Código: {codigoId || "Ninguno"})</label>
        <textarea
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          rows="15"
          style={{fontFamily: 'Courier New', 'fontSize': '1rem'}}
          readOnly={isDisabled}
        ></textarea>
      </div>

      {error && <div className="form-error">{error}</div>}

      {resultado && (
        <pre className="optimizer-result">{resultado}</pre>
      )}
      
      {sugerencias.length > 0 && (
        <div className="suggestions-box" style={{marginTop: '15px'}}>
          <h4>Sugerencias de la IA (Ollama):</h4>
          <ul>
            {sugerencias.map((sug, index) => (
              <li key={index}>
                {sug.sugerencia}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Pestaña para HU-007: REPORTES ---
function ReportesTab() {
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerarReporte = async () => {
    setError(null);
    setReporte(null);
    setIsLoading(true);
    
    try {
      // La API ahora usa el JOIN complejo
      const res = await axios.get(`${API_URL}/api/reportes/generar`);
      setReporte(res.data);
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al generar el reporte.');
      }
    }
    setIsLoading(false);
  };
  
  const handleExportar = () => {
    if (!reporte) {
      setError("Primero debe generar un reporte para poder exportarlo.");
      return;
    }
    window.alert(
      `REPORTE AMBIENTAL FINAL (Simulación)\n\n` +
      `IMPACTO SOSTENIBLE (Real):\n` +
      `----------------------------------------\n` +
      `Emisiones Totales (Optimizadas): ${reporte.total_co2_generado.toFixed(6)} kg CO2\n` +
      `Emisiones (Método Tradicional): ${reporte.total_co2_tradicional_simulado.toFixed(6)} kg CO2\n` +
      `>> REDUCCIÓN DE EMISIONES: ${reporte.reduccion_porcentaje.toFixed(2)} %\n` +
      `----------------------------------------\n` +
      `Total de Análisis Registrados: ${reporte.total_analisis_realizados}`
    );
  };

  return (
    <div className="Tab-container">
      <h3>Generación de Reportes Ambientales (HU-007)</h3>
      <p>
        Genera un reporte final que resume todas las métricas de CO2 monitoreadas en la base de datos (del Proyecto ID 1).
      </p>
      
      <div className="code-controls">
        <button onClick={handleGenerarReporte} className="btn btn-purple" disabled={isLoading}>
          {isLoading ? "Generando..." : "1. Generar Reporte (BBDD Real)"}
        </button>
        <button onClick={handleExportar} className="btn btn-priority-medium" disabled={!reporte}>
          4. Exportar Reporte Final
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {reporte && (
        <div className="report-final-box">
          <h4 style={{color: 'var(--accent-green)', marginTop: 0}}>Reporte Ambiental Final Generado</h4>
          <p>
            Basado en **{reporte.total_analisis_realizados}** análisis de rendimiento registrados en la BBDD.
          </p>
          
          <div className="report-stats">
            <div className="stat-card">
              <div className="stat-card-label">Emisiones Totales (Optimizadas)</div>
              <div className="stat-card-value">{reporte.total_co2_generado.toFixed(6)} kg</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-card-label">Reducción vs. Tradicional</div>
              <div className="stat-card-value green">{reporte.reduccion_porcentaje.toFixed(2)} %</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Pestaña para HU-008: DESPLIEGUE ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function DespliegueTab() {
  const [preCheck, setPreCheck] = useState(null);
  const [deployLog, setDeployLog] = useState("A la espera de la revisión de métricas...");
  const [issueReport, setIssueReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // *** MODIFICADO ***
  const handlePreCheck = async () => {
    setError(null);
    setIssueReport(null);
    setDeployLog("Ejecutando revisión (Pre-flight check)...");
    setIsLoading(true);
    
    try {
      // La API ahora usa el JOIN complejo
      const res = await axios.get(`${API_URL}/api/despliegue/pre-check`);
      setPreCheck(res.data);
      if (res.data.pasa_revision) {
        setDeployLog("Revisión APROBADA. Listo para desplegar.");
      } else {
         setDeployLog("Revisión FALLIDA. El último análisis supera el benchmark.");
      }
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al revisar las métricas.');
      }
    }
    setIsLoading(false);
  };

  const handleDeploy = async () => {
    setError(null);
    setIssueReport(null);
    setDeployLog("Iniciando despliegue en entorno cloud (simulado)...\n");
    setIsLoading(true);
    
    await sleep(1000);
    setDeployLog(log => log + "Conectando con Vercel/Render...\n");
    await sleep(1500);
    setDeployLog(log => log + "Provisionando contenedores...\n");
    await sleep(1000);
    setDeployLog(log => log + "Ejecutando health-check...\n");
    await sleep(500);
    setDeployLog(log => log + "¡DESPLIEGUE COMPLETADO!\n\n");
    
    setDeployLog(log => log + "VALIDACIÓN (CA 3): Despliegue completado.");
    setIsLoading(false);
  };

  // *** MODIFICADO ***
  const handleSimularIssue = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // La API ahora usa el JOIN complejo
      const res = await axios.get(`${API_URL}/api/despliegue/simular-issue`);
      setIssueReport(res.data);
    } catch (err) {
       setError('Error al analizar el issue.');
    }
     setIsLoading(false);
  };
  
  const handleFeedback = () => {
    if(!feedback) return;
    alert(`FEEDBACK REGISTRADO (CA 4):\n\n"${feedback}"`);
    setFeedback("");
  }

  return (
    <div className="Tab-container">
      <h3>Despliegue y Revisión de Métricas (HU-008)</h3>

      <div className="deploy-step">
        <h4>Paso 1: Revisión de Métricas (BBDD Real)</h4>
        <button onClick={handlePreCheck} className="btn btn-purple" disabled={isLoading}>
          1. Revisar Última Métrica (BBDD)
        </button>
        {preCheck && (
          <div className={`pre-check-report ${preCheck.pasa_revision ? 'pre-check-pass' : 'pre-check-fail'}`}>
            {preCheck.pasa_revision ? '✔ REVISIÓN APROBADA' : '❌ REVISIÓN FALLIDA'}
            <br />
            Métrica Actual: {preCheck.metrica_actual_co2.toFixed(6)} kg CO2
            <br />
            Benchmark: {preCheck.benchmark_co2.toFixed(6)} kg CO2
          </div>
        )}
      </div>

      <div className="deploy-step">
        <h4>Paso 2: Despliegue y Validación (Simulado)</h4>
        <button onClick={handleDeploy} className="btn btn-green" disabled={isLoading || !preCheck || !preCheck.pasa_revision}>
          2. Iniciar Despliegue (Simulado)
        </button>
        <pre className="deploy-log">{deployLog}</pre>
      </div>

      <div className="deploy-step">
        <h4>Paso 3: Análisis Post-Despliegue (BBDD Real)</h4>
        <button onClick={handleSimularIssue} className="btn btn-priority-high" disabled={isLoading}>
          3. Simular Issue (Correlación BBDD)
        </button>
        {issueReport && (
           <div className={`pre-check-report ${!issueReport.correlacion_energetica ? 'pre-check-pass' : 'pre-check-fail'}`}>
             {issueReport.mensaje}
           </div>
        )}
      </div>

      <div className="deploy-step">
        <h4>Paso 4: Registrar Feedback (Simulado)</h4>
        <div className="form-group">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows="3"
            placeholder="Escribe tu feedback aquí..."
          ></textarea>
        </div>
        <button onClick={handleFeedback} className="btn btn-priority-medium">
          4. Registrar Feedback
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      
    </div>
  );
}


// --- Componente Principal de la App ---
function App() {
  const [tab, setTab] = useState('requisitos');
  
  // --- ESTADO LEVANTADO ---
  const [codigo, setCodigo] = useState(CODIGO_INEFICIENTE_EJEMPLO);
  // --- NUEVO ESTADO PARA EL FLUJO DE BBDD ---
  const [arquitecturaId, setArquitecturaId] = useState(null);
  const [codigoId, setCodigoId] = useState(null);

  const renderTab = () => {
    switch (tab) {
      case 'requisitos':
        return <RequisitosTab />;
      case 'arquitectura':
        // Pasa los setters para el flujo
        return <ArquitecturaTab 
                  setCodigo={setCodigo} 
                  setArquitecturaId={setArquitecturaId} 
                  setCodigoId={setCodigoId}
                  setTab={setTab} 
                />;
      case 'optimizador':
        return <OptimizadorTab codigo={codigo} setCodigo={setCodigo} codigoId={codigoId} />;
      case 'pruebas':
        return <PruebasTab codigo={codigo} codigoId={codigoId} />;
      case 'refactor': 
        return <RefactorizacionTab codigo={codigo} setCodigo={setCodigo} codigoId={codigoId} />;
      case 'reportes': 
        return <ReportesTab />;
      case 'despliegue':
        return <DespliegueTab />;
      case 'dashboard':
        return <DashboardTab />;
      default:
        return <RequisitosTab />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>EcoDev Platform</h1>
      </header>
      <nav className="App-nav">
        <button 
          className={tab === 'requisitos' ? 'active' : ''} 
          onClick={() => setTab('requisitos')}>
            1. Requisitos
        </button>
        <button 
          className={tab === 'arquitectura' ? 'active' : ''} 
          onClick={() => setTab('arquitectura')}>
            2. Arquitectura
        </button>
        <button 
          className={tab === 'optimizador' ? 'active' : ''} 
          onClick={() => setTab('optimizador')}>
            3. Codificación
        </button>
        <button 
          className={tab === 'pruebas' ? 'active' : ''} 
          onClick={() => setTab('pruebas')}>
            4. Pruebas
        </button>
        <button 
          className={tab === 'refactor' ? 'active' : ''} 
          onClick={() => setTab('refactor')}>
            5. Refactorización
        </button>
        <button 
          className={tab === 'reportes' ? 'active' : ''} 
          onClick={() => setTab('reportes')}>
            6. Reportes
        </button>
        <button 
          className={tab === 'despliegue' ? 'active' : ''} 
          onClick={() => setTab('despliegue')}>
            7. Despliegue
        </button>
        <button 
          className={tab === 'dashboard' ? 'active' : ''} 
          onClick={() => setTab('dashboard')}>
            8. Dashboard
        </button>
      </nav>
      {renderTab()}
    </div>
  );
}

export default App;