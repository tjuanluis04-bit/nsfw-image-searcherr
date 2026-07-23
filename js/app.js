let currentPage = 0;
let currentTags = '';
let selectedImages = new Set();

const API_BASE = 'https://api.rule34.xxx/index.php';

async function searchImages(tags = '', page = 0) {
    const loading = document.getElementById('loading');
    const loadMoreBtn = document.getElementById('load-more');
    loading.classList.remove('hidden');
    loadMoreBtn.classList.add('hidden');

    let query = `page=dapi&s=post&q=index&json=1&limit=50&pid=${page}`;
    if (tags) query += `&tags=${encodeURIComponent(tags)}`;

    try {
        const res = await fetch(`\( {API_BASE}? \){query}`);
        const data = await res.json();

        if (page === 0) {
            document.getElementById('results').innerHTML = '';
            selectedImages.clear();
        }

        if (data.length === 0 && page === 0) {
            document.getElementById('results').innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px;">No se encontraron resultados.</p>';
            return;
        }

        renderImages(data);
        
        if (data.length === 50) {
            loadMoreBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
        alert('Error al conectar con la API');
    } finally {
        loading.classList.add('hidden');
    }
}

function renderImages(images) {
    const container = document.getElementById('results');
    
    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const thumb = img.preview_url || img.file_url.replace('images', 'thumbnails').replace(/\.([^.]+)$/, '.jpg');
        
        card.innerHTML = `
            <input type="checkbox" class="select-checkbox" data-url="${img.file_url}">
            <img src="\( {thumb}" alt=" \){img.tags}" loading="lazy">
            <div class="image-info">
                <span>❤️ ${img.score || '?'}</span>
                <span>\( {img.width}× \){img.height}</span>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('select-checkbox')) {
                showModal(img);
            }
        });
        
        const checkbox = card.querySelector('.select-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedImages.add(img.file_url);
            } else {
                selectedImages.delete(img.file_url);
            }
            updateBatchButton();
        });
        
        container.appendChild(card);
    });
}

function showModal(img) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-image');
    const downloadBtn = document.getElementById('modal-download');
    const sourceLink = document.getElementById('modal-source');
    
    modalImg.src = img.file_url;
    sourceLink.href = `https://rule34.xxx/index.php?page=post&s=view&id=${img.id}`;
    
    downloadBtn.onclick = () => downloadSingle(img.file_url, `nsfw_\( {img.id}. \){img.file_url.split('.').pop()}`);
    
    modal.classList.remove('hidden');
}

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});

function downloadSingle(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Descarga múltiple
function downloadMultiple() {
    if (selectedImages.size === 0) {
        alert('Selecciona al menos una imagen');
        return;
    }
    
    let delay = 0;
    selectedImages.forEach(url => {
        setTimeout(() => {
            const filename = `nsfw_\( {Date.now()}_ \){url.split('/').pop()}`;
            downloadSingle(url, filename);
        }, delay);
        delay += 300; // Evita bloqueos del navegador
    });
}

// Botón de descarga múltiple (añadir en header)
function createBatchButton() {
    const btn = document.createElement('button');
    btn.id = 'batch-download';
    btn.textContent = `Descargar seleccionadas (${selectedImages.size})`;
    btn.style.cssText = 'position:fixed; bottom:30px; right:30px; padding:15px 25px; background:#ff2d55; color:white; border:none; border-radius:50px; font-size:1.1rem; box-shadow:0 4px 15px rgba(255,45,85,0.4); z-index:200; display:none;';
    document.body.appendChild(btn);
    
    btn.addEventListener('click', downloadMultiple);
    return btn;
}

function updateBatchButton() {
    const btn = document.getElementById('batch-download') || createBatchButton();
    if (selectedImages.size > 0) {
        btn.textContent = `Descargar seleccionadas (${selectedImages.size})`;
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

// Eventos
document.getElementById('search-btn').addEventListener('click', () => {
    currentTags = document.getElementById('search-input').value.trim();
    currentPage = 0;
    searchImages(currentTags, currentPage);
});

document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

document.getElementById('load-more').addEventListener('click', () => {
    currentPage++;
    searchImages(currentTags, currentPage);
});

// Inicializar
window.onload = () => {
    // Búsqueda inicial sugerida
    searchImages('1girl solo', 0);
};