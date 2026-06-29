const API_KEY = 'c6d3627b83d6a27526f247fae1a7a65a';
let globalPiezas = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || []; 
window.climaActual = "Cargando clima...";

async function init() {
    try {
        const res = await fetch('data.json');
        const data = await res.json();
        globalPiezas = data.piezas;

        // Sincronizar stock inicial: restamos lo que ya estaba en el carrito al cargar la página
        carrito.forEach(item => {
            const prod = globalPiezas.find(p => p.id === item.id);
            if (prod && prod.stock > 0) prod.stock--;
        });

        renderizar(globalPiezas);
        setInterval(actualizarReloj, 1000);
        obtenerClima();
        actualizarCarritoUI(); // Iniciar contador
    } catch (e) { console.error("Error cargando JSON:", e); }
}

// --- LÓGICA DE CARRITO ---

function actualizarCarritoUI() {
    const counter = document.getElementById('cart-counter');
    if (counter) counter.innerText = carrito.length;
}

function agregarAlCarrito(id) {
    const producto = globalPiezas.find(p => p.id === id);
    
    if (!producto.stock || producto.stock <= 0) {
        mostrarNotificacion("Sin stock disponible", "#d32f2f");
        return;
    }

    carrito.push(producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    producto.stock--;
    renderizar(globalPiezas); // Actualiza la vista del catálogo
    actualizarCarritoUI();    // Actualiza el contador
    mostrarNotificacion(`Agregado: ${producto.nombre}`);
}

function quitarDelCarrito(index) {
    const item = carrito[index];
    
    // Devolver stock al catálogo
    const prod = globalPiezas.find(p => p.id === item.id);
    if (prod) prod.stock++;
    
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    renderizar(globalPiezas); // Refresca el catálogo
    renderizarCarrito();      // Refresca la vista del carrito con el nuevo total
    actualizarCarritoUI();    // Refresca el contador
}

function renderizarCarrito() {
    const listaDiv = document.getElementById('lista-carrito');
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    
    if (carrito.length === 0) {
        listaDiv.innerHTML = '<p>Tu carrito está vacío.</p>';
        return;
    }

    // Calcular el total sumando los precios
    const total = carrito.reduce((acumulador, producto) => acumulador + producto.precio, 0);

    listaDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            ${carrito.map((p, index) => `
                <div class="cart-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ddd; align-items:center;">
                    <span>${p.nombre} - ${formatter.format(p.precio)}</span>
                    <button class="btn-eliminar" onclick="quitarDelCarrito(${index})" style="background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Quitar</button>
                </div>
            `).join('')}
        </div>
        <div style="text-align: right; font-size: 1.5rem; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-bottom: 20px;">
            Total: ${formatter.format(total)}
        </div>

        <div class="payment-section">
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">Medios de pago seguros:</p>
            <div class="payment-logos">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex">
            </div>
            <button class="btn-pagar" onclick="pagarCarrito()">Finalizar Compra</button>
        </div>
    `;
}

function pagarCarrito() {
    // Redirige al usuario a la plataforma de pagos
    alert("Redirigiendo a la pasarela de pagos...");
    window.location.href = "https://www.mercadopago.com.ar"; 
}

// --- RENDERIZADO GENERAL ---

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

function mostrarNotificacion(mensaje, color = "#2e7d32") {
    const div = document.createElement('div');
    div.className = 'notificacion-toast';
    div.style.backgroundColor = color;
    div.textContent = mensaje;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// --- UTILIDADES Y CLIMA ---

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
    ['home', 'contacto', 'login', 'carrito'].forEach(s => {
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
