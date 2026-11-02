document.addEventListener('DOMContentLoaded', () => {
    // --- 1. RENDER CATEGORIES (CAPSULES) ---
    const categoryContainer = document.getElementById('category-capsules');
    const allCategories = [{ id: 'all', name: 'All Accessories' }, ...DEMO_CATEGORIES];
    let activeCategory = 'all';

    const renderCapsules = () => {
        categoryContainer.innerHTML = '';
        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `category-capsule ${activeCategory === cat.id ? 'active' : ''}`;
            btn.textContent = cat.name;
            btn.onclick = () => {
                activeCategory = cat.id;
                renderCapsules();
                filterProducts();
            };
            categoryContainer.appendChild(btn);
        });
    };

    // --- 2. RENDER PRODUCTS & FILTERING ---
    const trendingGrid = document.getElementById('trending-grid');
    const newArrivalsGrid = document.getElementById('new-arrivals-grid');

    const filterProducts = () => {
        let filtered = DEMO_PRODUCTS;
        if (activeCategory !== 'all') {
            const catName = DEMO_CATEGORIES.find(c => c.id === activeCategory)?.name;
            filtered = DEMO_PRODUCTS.filter(p => p.category === catName || p.category === 'Women' || p.category === 'Men'); 
            // Note: A simple match for demo. In real app, exact subcategory match.
        }
        
        trendingGrid.innerHTML = '';
        filtered.slice(0, 4).forEach(p => trendingGrid.appendChild(createProductCard(p)));
        
        newArrivalsGrid.innerHTML = '';
        filtered.filter(p => p.isNew).slice(0, 4).forEach(p => newArrivalsGrid.appendChild(createProductCard(p)));
        
        if(trendingGrid.innerHTML === '') trendingGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No products found.</p>';
        if(newArrivalsGrid.innerHTML === '') newArrivalsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No new arrivals in this category.</p>';
    };

    renderCapsules();
    filterProducts();

    // --- 3. HERO CAROUSEL (Seamless Loop) ---
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');
    let currentSlide = 0;
    let isTransitioning = false;
    let carouselInterval;

    const slidesToRender = [...HERO_BANNERS, HERO_BANNERS[0]]; // Clone first for seamless
    
    slidesToRender.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slideEl.innerHTML = `
            <div class="slide-bg" style="background-image: url('${slide.image}')"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <h1>${slide.title}</h1>
                <p>${slide.subtitle}</p>
                <a href="${slide.btnLink}" class="btn btn-primary">${slide.btnText}</a>
            </div>
        `;
        track.appendChild(slideEl);

        if (index < HERO_BANNERS.length) {
            const dot = document.createElement('button');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        }
    });

    const startCarousel = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        stopCarousel();
        carouselInterval = setInterval(() => nextSlide(), 2000);
    };

    const stopCarousel = () => clearInterval(carouselInterval);

    const goToSlide = (index) => {
        if (isTransitioning) return;
        isTransitioning = true;

        const realIndex = index % HERO_BANNERS.length;
        const dots = document.querySelectorAll('.dot');
        
        // Handle clone jump
        if (index === HERO_BANNERS.length) {
            track.style.transition = 'none';
            track.style.transform = `translateX(-${HERO_BANNERS.length * 100}%)`;
            void track.offsetWidth; // reflow
            track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(0%)`;
            currentSlide = 0;
        } else {
            track.style.transform = `translateX(-${index * 100}%)`;
            currentSlide = index;
        }

        // Update active states
        document.querySelectorAll('.carousel-slide').forEach((s, i) => {
            s.classList.remove('active');
            if (i === currentSlide) {
                void s.offsetWidth;
                s.classList.add('active');
            }
        });

        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

        setTimeout(() => isTransitioning = false, 600);
    };

    const nextSlide = () => goToSlide(currentSlide + 1);
    
    document.getElementById('carousel-next').onclick = () => { stopCarousel(); nextSlide(); startCarousel(); };
    document.getElementById('carousel-prev').onclick = () => { 
        stopCarousel(); 
        if(currentSlide === 0) {
            // Jump to clone then animate back
            track.style.transition = 'none';
            track.style.transform = `translateX(-${HERO_BANNERS.length * 100}%)`;
            void track.offsetWidth;
            track.style.transition = 'transform 0.6s';
            goToSlide(HERO_BANNERS.length - 1);
        } else {
            goToSlide(currentSlide - 1);
        }
        startCarousel(); 
    };

    document.getElementById('carousel').addEventListener('mouseenter', stopCarousel);
    document.getElementById('carousel').addEventListener('mouseleave', startCarousel);
    startCarousel();

    // --- 4. ANIMATED SEARCH PLACEHOLDER & SUGGESTIONS ---
    const searchInput = document.getElementById('search-input');
    const placeholders = ["Search earrings...", "Search men's accessories...", "Search handbags...", "Search jewellery..."];
    let placeholderIndex = 0;
    let placeholderInterval;
    let isSearchFocused = false;

    const cyclePlaceholder = () => {
        if (isSearchFocused || searchInput.value.length > 0) return;
        searchInput.style.opacity = 0;
        setTimeout(() => {
            searchInput.placeholder = placeholders[placeholderIndex];
            searchInput.style.opacity = 1;
            placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        }, 300);
    };
    
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        placeholderInterval = setInterval(cyclePlaceholder, 2500);
    } else {
        searchInput.placeholder = "Search products...";
    }

    searchInput.addEventListener('focus', () => { isSearchFocused = true; searchInput.style.opacity = 1; });
    searchInput.addEventListener('blur', () => { 
        isSearchFocused = false; 
        if(searchInput.value === '') cyclePlaceholder();
    });

    // Search Dropdown Logic
    const dropdown = document.getElementById('search-dropdown');
    const searchIndex = [...DEMO_PRODUCTS.map(p => ({...p, type: 'product'})), ...DEMO_CATEGORIES.map(c => ({...c, type: 'category'}))];

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) { dropdown.classList.add('hidden'); return; }

        const results = searchIndex.filter(item => item.name.toLowerCase().includes(val)).slice(0, 5);
        dropdown.innerHTML = '';
        
        if (results.length === 0) {
            dropdown.innerHTML = '<div class="no-results">No matching products or categories</div>';
        } else {
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'search-item';
                if (item.type === 'product') {
                    div.innerHTML = `<img src="${item.image}" alt=""><div><div class="search-item-name">${item.name}</div><div class="search-item-meta">${formatPrice(item.price)}</div></div>`;
                    div.onclick = () => window.location.href = `product.html?id=${item.id}`;
                } else {
                    div.innerHTML = `<div style="padding:10px;"><strong>${item.name}</strong> (Category)</div>`;
                    div.onclick = () => { dropdown.classList.add('hidden'); document.getElementById('categories').scrollIntoView({behavior:'smooth'}); };
                }
                dropdown.appendChild(div);
            });
        }
        dropdown.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) dropdown.classList.add('hidden');
    });

    // --- 5. MOBILE DRAWER ---
    const drawer = document.getElementById('menu-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    
    document.getElementById('hamburger-btn').onclick = () => {
        drawer.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    const closeDrawer = () => {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    };
    document.getElementById('close-drawer').onclick = closeDrawer;
    backdrop.onclick = closeDrawer;
});