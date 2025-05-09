// Create and insert navigation bar component
export function insertNavbar(activePage = '') {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <div class="menu-toggle">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div class="logo">
            <img src="images/logo.png" alt="Sagar Pharmacy Logo">
        </div>
        <div class="nav-links">
            <a href="index.html" ${activePage === 'home' ? 'class="active"' : ''}>Home</a>
            <a href="doctors.html" ${activePage === 'doctors' ? 'class="active"' : ''}>Doctor's Timings</a>
            <a href="products.html" ${activePage === 'products' ? 'class="active"' : ''}>Products</a>
            <a href="contact.html" ${activePage === 'contact' ? 'class="active"' : ''}>Contact Us</a>
        </div>
        <div class="search-container">
            <input type="text" class="search-box" placeholder="Search medicines...">
            <button class="search-button" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </button>
        </div>
        <a href="tel:+918371973208" class="call-btn">Call Now</a>
    `;
    document.body.insertBefore(navbar, document.body.firstChild);
}
