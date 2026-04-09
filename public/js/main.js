let currentFilters = {
    size: 'all',
    size_detail: 'all',
    status: 'all',
    search: ''
};

const sizeDetailOptions = {
    small: [
        { value: '40-50', label: '40-50cm' },
        { value: '60-70', label: '60-70cm' },
        { value: '70', label: '70cm' }
    ],
    medium: [
        { value: '80-90', label: '80-90cm' },
        { value: '100', label: '100cm' },
        { value: '120', label: '120cm' }
    ],
    large: [
        { value: '150', label: '150cm' },
        { value: '180-200', label: '180-200cm' }
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

    // 灯箱元素
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = lightbox.querySelector('.lightbox-content');
    const closeBtn = document.getElementById('lightboxClose');
    const imageWrapper = document.getElementById('imageWrapper');
    const lightboxImg = document.getElementById('lightboxImg');
    const imageContainer = lightbox.querySelector('.lightbox-image-container');
    const zoomControls = lightbox.querySelector('.zoom-controls');
    const lightboxInfo = lightbox.querySelector('.lightbox-info');

    // 点击关闭按钮
    closeBtn.addEventListener('click', () => {
        closeLightbox();
    });

    // 点击灯箱背景关闭
    lightbox.addEventListener('click', (e) => {
        // 如果灯箱未激活，不处理
        if (!lightbox.classList.contains('active')) return;

        // 如果点击的是关闭按钮
        if (e.target === closeBtn || closeBtn.contains(e.target)) {
            closeLightbox();
            return;
        }
        // 如果点击的是缩放按钮
        if (e.target.closest('.zoom-controls')) {
            return;
        }
        // 如果点击的是详情区域内的按钮，不关闭
        if (e.target.closest('.lightbox-info')) {
            // 检查是否点击的是按钮或输入框等可交互元素
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
                return;
            }
            // 点击详情区域空白处，关闭
            closeLightbox();
            return;
        }
        // 如果点击的是图片，切换缩放
        if (e.target === lightboxImg) {
            toggleZoom();
            return;
        }
        // 如果点击的是图片容器（包括空白区域）或灯箱内容
        if (e.target === imageContainer || e.target === imageWrapper ||
            imageContainer.contains(e.target) || lightboxContent.contains(e.target)) {
            closeLightbox();
            return;
        }
        // 其他情况（背景）关闭
        closeLightbox();
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // 缩放控制
    let currentScale = 1;
    const minScale = 0.5;
    const maxScale = 4;
    const scaleStep = 0.5;

    function updateScale(scale) {
        currentScale = Math.max(minScale, Math.min(maxScale, scale));
        lightboxImg.style.transform = `scale(${currentScale})`;
        imageWrapper.classList.toggle('zoomed', currentScale > 1);
    }

    function toggleZoom() {
        if (currentScale > 1) {
            updateScale(1);
        } else {
            updateScale(2);
        }
    }

    document.getElementById('zoomInBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        updateScale(currentScale + scaleStep);
    });

    document.getElementById('zoomOutBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        updateScale(currentScale - scaleStep);
    });

    document.getElementById('zoomResetBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        updateScale(1);
    });

    // 双指缩放支持
    let initialDistance = 0;
    let initialScale = 1;

    lightboxImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialScale = currentScale;
        }
    });

    lightboxImg.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scale = (currentDistance / initialDistance) * initialScale;
            updateScale(scale);
        }
    });

    function getDistance(touch1, touch2) {
        return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        updateScale(1);
        translateX = 0;
        translateY = 0;
    }

    // 图片拖动功能
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let translateX = 0;
    let translateY = 0;

    function startDrag(e) {
        if (currentScale <= 1) return;
        if (e.target !== lightboxImg) return;

        isDragging = true;
        dragStartX = e.clientX || e.touches[0].clientX;
        dragStartY = e.clientY || e.touches[0].clientY;
        imageWrapper.classList.add('dragging');
        lightboxImg.style.cursor = 'grabbing';
    }

    function doDrag(e) {
        if (!isDragging) return;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (clientX === undefined) return;

        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;

        translateX += deltaX;
        translateY += deltaY;

        lightboxImg.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;

        dragStartX = clientX;
        dragStartY = clientY;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        imageWrapper.classList.remove('dragging');
        lightboxImg.style.cursor = currentScale > 1 ? 'grab' : 'zoom-in';
    }

    // 鼠标事件
    lightboxImg.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);

    // 触摸事件
    lightboxImg.addEventListener('touchstart', startDrag, { passive: true });
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    // 重置缩放时重置位置
    function updateScale(scale) {
        currentScale = Math.max(minScale, Math.min(maxScale, scale));
        lightboxImg.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        imageWrapper.classList.toggle('zoomed', currentScale > 1);
        lightboxImg.style.cursor = currentScale > 1 ? 'grab' : 'zoom-in';

        // 如果恢复到1x，重置位置
        if (currentScale === 1) {
            translateX = 0;
            translateY = 0;
        }
    }
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
        ? `长${item.size_detail}cm 宽${item.width}cm`
        : `${item.size_detail}cm`;

    img.src = item.image_path;
    title.textContent = `${item.size_detail}cm 鱼缸造景`;
    dimensions.innerHTML = `规格: ${sizeText}`;
    if (item.bottom_sand) {
        dimensions.innerHTML += `<br><span style="color: #7dd3fc;">🎁 赠送${item.bottom_sand}斤底沙</span>`;
    }
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
