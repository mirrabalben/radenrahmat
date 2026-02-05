/**
 * SUPER ADMIN DYNAMIC LOADER
 * Fetches site_config.json and updates the DOM elements.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Determine relative path to data folder
    // If we are in subdirectory (mi/, smp/), path is ../
    const pathPrefix = window.location.pathname.includes('/mi/') || window.location.pathname.includes('/smp/') ? '../' : '';
    const configFile = `${pathPrefix}data/site_config.json`;

    try {
        const res = await fetch(configFile);
        const config = await res.json();

        // Determine current page
        let pageKey = 'main';
        if (window.location.pathname.includes('/mi/')) pageKey = 'mi';
        if (window.location.pathname.includes('/smp/')) pageKey = 'smp';

        // 1. UPDATE NAVBAR
        // For main site, use global navbar. For MI/SMP, use page-specific navbar
        const navbarConfig = pageKey === 'main' ? config.global.navbar : (config.pages[pageKey]?.navbar || []);
        renderNavbar(navbarConfig, pathPrefix, pageKey);

        // 2. UPDATE PAGE SPECIFIC CONTENT
        updatePageContent(config, pathPrefix);

    } catch (e) {
        console.error("Failed to load site config:", e);
    }
});

function renderNavbar(items, prefix, pageKey = 'main') {
    const navContainer = document.querySelector('.nav-menu') || document.querySelector('.navbar-nav');
    if (!navContainer) return;

    // Different HTML structure for Main (ul.nav-menu) vs Subsites (ul.navbar-nav with Bootstrap)
    const isBootstrap = navContainer.classList.contains('navbar-nav');

    function normalizeLink(link, prefix) {
        if (!link || link.startsWith('http') || link.startsWith('#')) return link;
        // Remove existing ../ prefixes to get "root relative" path
        const clean = link.replace(/^(\.\.\/)+/, '');
        return prefix + clean;
    }

    let html = '';

    items.forEach(item => {
        const link = normalizeLink(item.link, prefix);
        const icon = item.icon ? `<i class="${item.icon} me-2"></i>` : '';
        const iconOnly = item.iconOnly && item.icon ? `<i class="${item.icon}"></i>` : '';
        const customClass = item.class || '';
        const activeClass = item.active ? 'active' : '';

        if (item.dropdown) {
            // Dropdown Logic (only for main site)
            if (isBootstrap) {
                html += `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">${item.text}</a>
                    <ul class="dropdown-menu">
                        ${item.dropdown.map(sub => `<li><a class="dropdown-item" href="${normalizeLink(sub.link, prefix)}" target="${sub.target || '_self'}">${sub.text}</a></li>`).join('')}
                    </ul>
                </li>`;
            } else {
                // Main Site Custom Dropdown
                html += `
                <li class="has-dropdown">
                    <a href="${link}">${item.text} <i class="fas fa-chevron-down" style="font-size: 0.7rem; margin-left: 5px;"></i></a>
                    <div class="dropdown">
                        ${item.dropdown.map(sub => `
                            <a href="${normalizeLink(sub.link, prefix)}" target="${sub.target || '_self'}">
                                ${sub.img ? `<img src="${normalizeLink(sub.img, prefix)}" class="menu-logo">` : ''} 
                                ${sub.text}
                            </a>
                        `).join('')}
                    </div>
                </li>`;
            }
        } else {
            // Single Link
            if (isBootstrap) {
                // For MI/SMP sites with Bootstrap navbar
                if (customClass.includes('btn')) {
                    // Special button styling (like PPDB button or back button)
                    html += `<li class="nav-item ${customClass.includes('ms-') ? customClass.match(/ms-\w+/)?.[0] || '' : ''}">
                        <a class="nav-link ${customClass}" href="${link}">${iconOnly || (icon + item.text)}</a>
                    </li>`;
                } else {
                    html += `<li class="nav-item"><a class="nav-link ${activeClass}" href="${link}">${icon}${item.text}</a></li>`;
                }
            } else {
                // Main site
                html += `<li><a href="${link}" class="${activeClass}">${item.text}</a></li>`;
            }
        }
    });

    // Replace content
    navContainer.innerHTML = html;
}

function updatePageContent(config, prefix) {
    // Identify current page by some marker or URL
    let pageKey = 'main';
    if (window.location.pathname.includes('/mi/')) pageKey = 'mi';
    if (window.location.pathname.includes('/smp/')) pageKey = 'smp';

    const pageData = config.pages[pageKey];
    if (!pageData) return;

    // Update Hero Title
    // Selectors might vary.
    const titleEl = document.querySelector('h1.display-3') || document.querySelector('.hero-content h1') || document.querySelector('.hero-content h2');
    if (titleEl && pageData.hero_title) titleEl.innerText = pageData.hero_title;

    // Update Hero Description
    const descEl = document.querySelector('.lead') || document.querySelector('.hero-content p');
    if (descEl && pageData.hero_desc) descEl.innerText = pageData.hero_desc;

    // Update Hero Background
    const heroSection = document.querySelector('.hero') || document.querySelector('.hero-section');
    if (heroSection && pageData.hero_bg) {
        let bgUrl = pageData.hero_bg;
        // Handle relative uploads vs absolute URLs
        if (!bgUrl.startsWith('http')) {
            // It's a file path. From 'smp/', uploads is '../uploads/'.
            // From root, uploads is 'uploads/'.
            // If the config value is simple filename 'foo.jpg', we add path.
            // If it is 'uploads/foo.jpg', we handle prefix.
            // Admin API saves as '../uploads/foo.jpg' usually ? No, let's check Admin API.
            // Admin API returns '../uploads/timestamp_name'.
            // If config has '../uploads/...', and we are in root, we need 'uploads/...'.
            // If we are in smp/, we need '../uploads/...'.

            // Simplest normalization:
            // Remove all '../' from start and prepend correct prefix for current location.
            const cleanPath = bgUrl.replace(/^(\.\.\/)+/, ''); // remove leading ../
            // If in root: 'uploads/foo.jpg'
            // If in subdir: '../uploads/foo.jpg'

            bgUrl = (prefix ? '../' : '') + cleanPath;
        }

        // Apply
        // Some sites use <img>, some use background-image
        const heroImg = heroSection.querySelector('img.hero-img');
        if (heroImg) {
            heroImg.src = bgUrl;
        } else {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0,50,0,0.7), rgba(0,50,0,0.7)), url('${bgUrl}')`;
        }
    }
}
