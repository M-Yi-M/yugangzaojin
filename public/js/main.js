let currentFilters = {
    size: 'all',
    size_detail: 'all',
    status: 'all',
    search: ''
};

const sizeDetailOptions = {
    small: [
        { value: '40-50', label: '40-50cm' },
        { value: '60-70', label: '60-70cm' }
    ],
    medium: [
        { value: '80-90', label: '80-90cm' },
        { value: '100', label: '100cm' },
        { value: '120', label: '120cm' }
    ],
    large: [
        { value: '150-200', label: '150-200cm' }
    ]
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    loadStats();
    setupEventListeners();
});

// 设置事件监听
function setupEventListeners() {
    // 筛选按钮
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const filter = btn.dataset.filter;

            // 更新按钮状态
            document.querySelectorAll(`[data-type="${type}"]`).forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            // 更新筛选条件
            currentFilters[type] = filter;

            // 如果是尺寸分类，显示细分选项
            if (type === 'size') {
                updateSizeDetailButtons(filter);
            }

            loadGallery();
        });
    });

    // 搜索
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value.trim();
        loadGallery();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.search = searchInput.value.trim();
            loadGallery();
        }
    });

    // 灯箱关闭
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// 更新细分尺寸按钮
function updateSizeDetailButtons(size) {
    const sizeDetailGroup = document.getElementById('sizeDetailGroup');

    if (size === 'all' || !sizeDetailOptions[size]) {
        sizeDetailGroup.style.display = 'none';
        currentFilters.size_detail = 'all';
        return;
    }

    sizeDetailGroup.style.display = 'flex';
    const options = sizeDetailOptions[size];

    sizeDetailGroup.innerHTML = `
        <button class="filter-btn active" data-filter="all" data-type="size_detail">全部</button>
        ${options.map(opt => `
            <button class="filter-btn" data-filter="${opt.value}" data-type="size_detail">${opt.label}</button>
        `).join('')}
    `;

    // 为新按钮添加事件监听
    sizeDetailGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sizeDetailGroup.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentFilters.size_detail = btn.dataset.filter;
            loadGallery();
        });
    });

    currentFilters.size_detail = 'all';
}

// 加载画廊
async function loadGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const params = new URLSearchParams();
        if (currentFilters.size !== 'all') params.append('size', currentFilters.size);
        if (currentFilters.size_detail !== 'all') params.append('size_detail', currentFilters.size_detail);
        if (currentFilters.status !== 'all') params.append('status', currentFilters.status);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`/api/aquariums?${params}`);
        const aquariums = await response.json();

        if (aquariums.length === 0) {
            gallery.innerHTML = '<div class="loading">暂无作品</div>';
            return;
        }

        gallery.innerHTML = '';

        aquariums.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.onclick = () => openLightbox(item);

            const statusClass = item.status === 'sold' ? 'sold' : 'available';
            const statusText = item.status === 'sold' ? '已售' : '在售';

            div.innerHTML = `
                <img src="${item.image_path}" alt="${item.size_detail}cm 鱼缸造景" loading="lazy">
                <div class="info">
                    <h3>${item.size_detail}cm 鱼缸造景</h3>
                    ${item.price ? `<p>💰 ¥${item.price}</p>` : ''}
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            `;

            gallery.appendChild(div);
        });
    } catch (error) {
        console.error('加载失败:', error);
        gallery.innerHTML = '<div class="loading">加载失败，请刷新重试</div>';
    }
}

// 加载统计信息
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const statItems = document.querySelectorAll('.stat-number');
        statItems[0].textContent = stats.total;
        statItems[1].textContent = stats.available;
        statItems[2].textContent = stats.sold;
    } catch (error) {
        console.error('加载统计失败:', error);
    }
}

// 打开灯箱
function openLightbox(item) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const title = document.getElementById('lightboxTitle');
    const dimensions = document.getElementById('lightboxDimensions');
    const style = document.getElementById('lightboxStyle');
    const description = document.getElementById('lightboxDescription');
    const tags = document.getElementById('lightboxTags');
    const price = document.getElementById('lightboxPrice');
    const status = document.getElementById('lightboxStatus');

    const sizeText = item.width
        ? `长${item.size_detail}cm 宽${item.width}cm 鱼缸造景`
        : `${item.size_detail}cm 鱼缸造景`;

    img.src = item.image_path;
    title.textContent = `${item.size_detail}cm 鱼缸造景`;
    dimensions.textContent = `规格: ${sizeText}`;
    style.textContent = '';
    description.textContent = '';
    tags.textContent = '';
    price.textContent = item.price ? `价格: ¥${item.price}` : '';

    const statusClass = item.status === 'sold' ? 'sold' : 'available';
    const statusText = item.status === 'sold' ? '已售' : '在售';
    status.className = `status-badge ${statusClass}`;
    status.textContent = statusText;

    lightbox.classList.add('active');
}
