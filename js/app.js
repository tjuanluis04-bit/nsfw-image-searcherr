let currentPage = 0;
let currentTags = '';
let selectedImages = new Set();

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const API_BASE = 'https://api.rule34.xxx/index.php';

async function searchImages(tags = '', page = 0) {
    const loading = document.getElementById('loading');
    const loadMoreBtn = document.getElementById('load-more');
    loading.classList.remove('hidden');
    loadMoreBtn.classList.add('hidden');

    let query = `page=dapi&s=post&q=index&json=1&limit=50&pid=${page}`;
    if (tags) query += `&tags=${encodeURIComponent(tags)}`;

    try {
        const url = `\( {CORS_PROXY} \){encodeURIComponent(`\( {API_BASE}? \){query}`)}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error('API error');
        
        const data = await res.json();

        if (page === 0) {
            document.getElementById('results').innerHTML = '';
            selectedImages.clear();
        }

        if (data.length === 0 && page === 0) {
            document.getElementById('results').innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px; color:#ff6b6b;">No se encontraron resultados.</p>';
            return;
        }

        renderImages(data);
        
        if (data.length === 50) {
            loadMoreBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
        document.getElementById('results').innerHTML = `
            <p style="text-align:center; grid-column:1/-1; padding:40px; color:#ff6b6b;">
                Error al conectar con la API.<br>
                Intenta de nuevo o usa otros tags.
            </p>`;
    } finally {
        loading.classList.add('hidden');
    }
}

// El resto del código se mantiene igual...
function renderImages(images) {
    const container = document.getElementById('results');
    
    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const thumb = img.preview_url || img.file_url;
        
        card.innerHTML = `
            <input type="checkbox" class="select-checkbox" data-url="${img.file_url}">
            <img src="\( {thumb}" alt=" \){img.tags}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/333/fff?text=Error'">
            <div class="image-info">
                <span>❤️ ${img.score || '?'}</span>
                <span>\( {img.width || '?'}× \){img.height || '?'}</span>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('select-checkbox')) {
                showModal(img);
            }
        });
        
        const checkbox = card.querySelector('.select-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) selectedImages.add(img.file_url);
            else selectedImages.delete(img.file_url);
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
    
    downloadBtn.onclick = () => downloadSingle(img.file_url, `nsfw_${img.id || Date.now()}.jpg`);
    
    modal.classList.remove('hidden');
}

function downloadSingle(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function createBatchButton() {
    let btn = document.getElementById('batch-download');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'batch-download';
        btn.style.cssText = 'position:fixed; bottom:30px; right:30px; padding:15px 25px; background:#ff2d55; color:white; border:none; border-radius:50px; font-size:1.1rem; box-shadow:0 4px 15px rgba(255,45,85,0.4); z-index:200;';
        document.body.appendChild(btn);
        btn.addEventListener('click', downloadMultiple);
    }
    return btn;
}

function downloadMultiple() {
    if (selectedImages.size === 0) return alert('Selecciona imágenes primero');
    
    let delay = 0;
    selectedImages.forEach(url => {
        setTimeout(() => {
            downloadSingle(url, `nsfw_\( {Date.now()}_ \){Math.random().toString(36).slice(2)}.jpg`);
        }, delay);
        delay += 400;
    });
}

function updateBatchButton() {
    const btn = createBatchButton();
    btn.textContent = `Descargar (${selectedImages.size})`;
    btn.style.display = selectedImages.size > 0 ? 'block' : 'none';
}

// Eventos
document.getElementById('search-btn').addEventListener('click', () => {
    currentTags = document.getElementById('search-input').value.trim();
    currentPage = 0;
    searchImages(currentTags, currentPage);
});

document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('search-btn').click();
});

document.getElementById('load-more').addEventListener('click', () => {
    currentPage++;
    searchImages(currentTags, currentPage);
});

window.onload = () => {
    searchImages('1girl solo', 0);
};