const API_KEY = 'c6d3627b83d6a27526f247fae1a7a65a';
let globalPiezas = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || []; 
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
            
            ${p.stock <= 3 && p.stock > 0 ? `<span class="bajo-stock">⚠️ ¡Últimas ${p.stock} unidades!</span>` : `<p>Stock: ${p.stock || 0}</p>`}
            
            <span class="price">${formatter.format(p.precio)}</span>
            
            <div class="comp-box">
                <p><strong>Aplica para:</strong></p>
                <ul class="comp-list">
                    ${p.compatibilidad.map(c => `<li>• ${c.marca} ${c.modelo} (${c.anio})</li>`).join('')}
                </ul>
            </div>
            
            <button onclick="agregarAlCarrito('${p.id}')">Agregar al Carrito</button>
        </div>
    `).join('');
}

// --- LÓGICA DE CARRITO Y STOCK ---

function agregarAlCarrito(id) {
    const producto = globalPiezas.find(p => p.id === id);
    
    // Validar Stock
    if (!producto.stock || producto.stock <= 0) {
        mostrarNotificacion("Sin stock disponible", "#d32f2f");
        return;
    }

    // Agregar al carrito
    carrito.push(producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Descontar stock visualmente
    producto.stock--;
    renderizar(globalPiezas); 
    
    mostrarNotificacion(`Agregado: ${producto.nombre}`);
}

function mostrarNotificacion(mensaje, color = "#2e7d32") {
    const div = document.createElement('div');
    div.className = 'notificacion-toast';
    div.style.backgroundColor = color;
    div.textContent = mensaje;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), 3000);
}

// --- RESTO DE FUNCIONES ---

function actualizarReloj() {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-AR', { hour12: false });
    const el = document.getElementById('info-header');
    if(el) el.innerText = `${window.climaActual} | ${hora}`;
}

async function obtenerClima() {
    try {
        const resIp = await fetch('https://ip-api.com/json/');
        const dataIp = await resIp.json();
        const ciudad = dataIp.city || "Quilmes"; 
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${API_KEY}&units=metric&lang=es`;
        const res = await fetch(url);
        const data = await res.json();
        window.climaActual = `${data.name}, ${Math.round(data.main.temp)}°C`;
    } catch (e) {
        window.climaActual = "Quilmes, 18°C"; 
    }
}

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
