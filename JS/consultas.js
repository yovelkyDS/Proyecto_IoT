// === Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9xUeHv-AsicZO2aJy5tGBv_i-rfrETeY",
  authDomain: "project-iot-52910.firebaseapp.com",
  databaseURL: "https://project-iot-52910-default-rtdb.firebaseio.com",
  projectId: "project-iot-52910",
  storageBucket: "project-iot-52910.firebasestorage.app",
  messagingSenderId: "852594242943",
  appId: "1:852594242943:web:a2d02b012632baf8c1564a",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Elementos DOM ===
const fechaInicioEl = document.getElementById("fecha-inicio");
const fechaFinEl = document.getElementById("fecha-fin");
const opcionEl = document.getElementById("opcion");
const var1Box = document.getElementById("select-var1");
const var2Box = document.getElementById("select-var2");
const var1El = document.getElementById("variable1");
const var2El = document.getElementById("variable2");
const btnConsultar = document.getElementById("btn-consultar");
const ctx = document.getElementById("graficoConsulta");
const statsContainer = document.getElementById("stats-container");

let grafico;

// === Mostrar u ocultar selectores según opción ===
opcionEl.addEventListener("change", () => {
  const modo = opcionEl.value;

  if (modo === "una") {
    var1Box.style.display = "block";
    var2Box.style.display = "none";
  } else if (modo === "dos") {
    var1Box.style.display = "block";
    var2Box.style.display = "block";
  } else if (modo === "todas") {
    var1Box.style.display = "none";
    var2Box.style.display = "none";
  }
});

// === Evento principal ===
btnConsultar.addEventListener("click", async () => {
  const fechaInicio = fechaInicioEl.value;
  const fechaFin = fechaFinEl.value;
  const modo = opcionEl.value;

  if (!fechaInicio || !fechaFin) {
    alert("Seleccione un rango de fechas válido.");
    return;
  }

  const datos = await obtenerDatosFirebase();
  const filtrados = filtrarPorFecha(datos, fechaInicio, fechaFin);
  if (filtrados.length === 0) {
    alert("No hay datos en el rango seleccionado.");
    return;
  }

  const fechas = filtrados.map(d => d.fecha_hora.split(" ")[0]);
  const datasets = [];
  statsContainer.innerHTML = "";

  // === Variables según modo ===
  let variables = [];

  if (modo === "una") {
    variables = [var1El.value];
  } else if (modo === "dos") {
    if (var1El.value === var2El.value) {
      alert("Seleccione dos variables diferentes.");
      return;
    }
    variables = [var1El.value, var2El.value];
  } else if (modo === "todas") {
    variables = ["temperatura", "humedad", "uv"];
  }

  // === Crear datasets y estadísticas
  variables.forEach(v => {
    const valores = filtrados.map(d => d[v]);
    datasets.push(crearDataset(v, valores));
    mostrarTarjetaEstadisticas(v, valores);
  });

  graficar(fechas, datasets);
});

// === Funciones auxiliares ===
async function obtenerDatosFirebase() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "monitoreo_clima"));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
}

function filtrarPorFecha(datos, inicio, fin) {
  const start = new Date(inicio);
  const end = new Date(fin);
  return datos.filter(d => {
    const f = new Date(d.fecha_hora);
    return f >= start && f <= end;
  });
}

function crearDataset(nombre, valores) {
  return {
    label: formatearNombre(nombre),
    data: valores,
    borderColor: colorVariable(nombre),
    tension: 0.3,
    fill: false
  };
}

function mostrarTarjetaEstadisticas(nombre, valores) {
  if (!valores.length) return;
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const prom = valores.reduce((a, b) => a + b, 0) / valores.length;

  const card = document.createElement("div");
  card.className = `card card--kpi kpi-${nombre}`;
  card.innerHTML = `
    <h2 class="mt-0">${formatearIcono(nombre)} ${formatearNombre(nombre)}</h2>
    <div class="kpi-values">
      <p><strong>Máx:</strong> ${max.toFixed(2)}</p>
      <p><strong>Mín:</strong> ${min.toFixed(2)}</p>
      <p><strong>Prom:</strong> ${prom.toFixed(2)}</p>
    </div>
  `;
  statsContainer.appendChild(card);
}

function formatearNombre(v) {
  switch (v) {
    case "temperatura": return "Temperatura (°C)";
    case "humedad": return "Humedad (%)";
    case "uv": return "Radiación UV";
    default: return v;
  }
}

function formatearIcono(v) {
  switch (v) {
    case "temperatura": return "🌡️";
    case "humedad": return "💧";
    case "uv": return "🌞";
    default: return "";
  }
}

function colorVariable(v) {
  switch (v) {
    case "temperatura": return "red";
    case "humedad": return "blue";
    case "uv": return "orange";
    default: return "gray";
  }
}

function graficar(fechas, datasets) {
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "line",
    data: { labels: fechas, datasets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { title: { display: true, text: "Fecha" }},
        y: { title: { display: true, text: "Valor" }}
      },
      plugins: { legend: { position: "top" } }
    }
  });
}
