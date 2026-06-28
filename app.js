const API_KEY = 'c6d3627b83d6a27526f247fae1a7a65a';
let globalPiezas = [];
window.climaActual = "Cargando clima...";

async function init() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        globalPiezas = data.piezas;
        renderizar(globalPiezas);
        setInterval(actualizarReloj, 1000);
        obtenerClima();
    } catch (e) { console.error("Error cargando JSON:", e); }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-piezas');
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    
    contenedor.innerHTML = lista.map(p => `
        <div class="pieza-card">
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <span class="price">${formatter.format(p.precio)}</span>
            
            <!-- Aquí agregamos las marcas y años -->
            <div class="comp-box">
                <p><strong>Aplica para:</strong></p>
                <ul class="comp-list">
                    ${p.compatibilidad.map(c => `<li>• ${c.marca} ${c.modelo} (${c.anio})</li>`).join('')}
                </ul>
            </div>
            
            <button onclick="alert('Agregado: ${p.nombre}')">Agregar</button>
        </div>
    `).join('');
}

function actualizarReloj() {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-AR', { hour12: false });
    document.getElementById('info-header').innerText = `${window.climaActual} | ${hora}`;
}

// CORRECCIÓN: Geolocalización automática por IP (sin permisos)
async function obtenerClima() {
    try {
        // 1. Detectar ciudad por IP
        const resIp = await fetch('https://ip-api.com/json/');
        const dataIp = await resIp.json();
        const ciudad = dataIp.city || "Quilmes"; 

        // 2. Consultar clima con la ciudad detectada
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${API_KEY}&units=metric&lang=es`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Ciudad no encontrada");
        
        const data = await res.json();
        window.climaActual = `${data.name}, ${Math.round(data.main.temp)}°C`;
    } catch (e) {
        console.error("Error detectando ubicación:", e);
        // Fallback si la API de IP falla
        window.climaActual = "Quilmes, 18°C"; 
    }
}

// Control de secciones
function showSection(id) {
    ['home', 'contacto', 'login'].forEach(s => {
        const el = document.getElementById(`section-${s}`);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(`section-${id}`);
    if(target) target.classList.remove('hidden');
}

// Eventos de Navegación
document.getElementById('main-logo').addEventListener('click', () => { showSection('home'); renderizar(globalPiezas); });
document.getElementById('btn-inicio').addEventListener('click', (e) => { e.preventDefault(); showSection('home'); renderizar(globalPiezas); });
document.getElementById('nav-contacto').addEventListener('click', (e) => { e.preventDefault(); showSection('contacto'); });
document.getElementById('nav-login').addEventListener('click', (e) => { e.preventDefault(); showSection('login'); });

document.querySelectorAll('.cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home');
        renderizar(globalPiezas.filter(p => p.categoria === e.target.dataset.cat));
    });
});

init();
