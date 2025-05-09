// Import configuration and components
import { CONFIG } from './config.js';
import { insertFooter } from './components/footer.js';
import { insertNavbar } from './components/navbar.js';

// Global medicine database and state
let medicineDatabase = [];
let isLoading = false;
let hasError = false;
let retryCount = 0;
const MAX_RETRIES = 3;
let lastUpdate = 0;

// Function to load medicines from Google Sheets
async function loadMedicineDatabase() {
    // Check if we need to refresh the data
    const now = Date.now();
    if (medicineDatabase.length > 0 && (now - lastUpdate) < CONFIG.UPDATE_INTERVAL) {
        return medicineDatabase;
    }

    while (retryCount < MAX_RETRIES) {
        try {
            isLoading = true;
            const response = await fetch(CONFIG.GOOGLE_SHEETS_URL);
            if (!response.ok) {
                throw new Error(`Failed to load medicine database: ${response.status}`);
            }
            const text = await response.text();
            if (!text.trim()) {
                throw new Error('Medicine database is empty');
            }

            const lines = text.split('\n');
            if (lines.length < 2) {
                throw new Error('Invalid medicine database format');
            }

            const headers = lines[0].split(',');
            const medicines = lines.slice(1).map(line => {
                const values = line.split(',');
                if (values.length < 3) {
                    console.warn('Invalid medicine entry:', line);
                    return null;
                }                return {
                    name: values[0].trim(),
                    category: values[1].trim(),
                    description: values[2].trim()
                };
            }).filter(Boolean); // Remove any invalid entries
            
            if (medicines.length === 0) {
                throw new Error('No valid medicines found in database');
            }            hasError = false;
            lastUpdate = Date.now();
            medicineDatabase = medicines;
            retryCount = 0; // Reset retry count on success
            return medicines;
        } catch (error) {
            console.error(`Error loading medicine database (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                hasError = true;                // Use fallback data from config if all retries fail
                return CONFIG.FALLBACK_DATA;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        } finally {
            isLoading = false;
        }
    }
}

// Initialize search functionality
async function initializeSearch() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;

    const searchContainer = searchBox.parentElement;
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchContainer.appendChild(searchResults);

    try {
        // Show loading state
        searchResults.innerHTML = '<div class="loading">Loading medicines...</div>';
        searchResults.classList.add('active');

        // Load the medicine database
        medicineDatabase = await loadMedicineDatabase();

        if (hasError) {
            searchResults.innerHTML = `
                <div class="search-error">
                    <p>Using limited medicine database.</p>
                    <button class="retry-button">Retry Loading</button>
                </div>`;
            
            // Add retry button functionality
            const retryButton = searchResults.querySelector('.retry-button');
            retryButton.addEventListener('click', async () => {
                retryCount = 0; // Reset retry count
                await initializeSearch(); // Try loading again
            });
        } else {
            searchResults.classList.remove('active');
        }

        // Handle search input with debounce
        let debounceTimer;
        searchBox.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            
            const searchTerm = searchBox.value.trim();
            if (searchTerm.length > 0) {
                searchResults.innerHTML = '<div class="loading">Searching...</div>';
                searchResults.classList.add('active');
            }
            
            debounceTimer = setTimeout(() => handleSearchInput(searchBox, searchResults), 300);
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });

        // Add search box animations
        searchBox.addEventListener('focus', () => {
            searchBox.parentElement.style.transform = 'scale(1.02)';
        });

        searchBox.addEventListener('blur', () => {
            setTimeout(() => {
                searchBox.parentElement.style.transform = 'scale(1)';
            }, 200);
        });

        // Check for search parameter in URL when page loads
        if (window.location.search && window.location.pathname.includes('products.html')) {
            const params = new URLSearchParams(window.location.search);
            const searchQuery = params.get('search');
            if (searchQuery) {
                setTimeout(() => {
                    searchBox.value = searchQuery;
                    searchBox.dispatchEvent(new Event('input'));
                    scrollToProduct(searchQuery);
                }, 500);
            }
        }
    } catch (error) {
        console.error('Error initializing search:', error);
    }
}

// Handle search input changes
function handleSearchInput(searchBox, searchResults) {
    const searchTerm = searchBox.value.toLowerCase().trim();
    
    if (searchTerm.length >= 2) {
        // Filter medicines based on search term
        const filteredResults = medicineDatabase.filter(medicine => 
            medicine.name.toLowerCase().includes(searchTerm) ||
            medicine.category.toLowerCase().includes(searchTerm) ||
            medicine.description.toLowerCase().includes(searchTerm)
        );

        // Display results
        displaySearchResults(filteredResults, searchResults, searchBox);
        searchResults.classList.add('active');
    } else {
        searchResults.classList.remove('active');
    }
}

// Display search results
function displaySearchResults(results, container, searchBox) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">No medicines found</div>';
        return;
    }

    container.innerHTML = results.map(medicine => `
        <div class="search-result-item">
            <h4>${medicine.name}</h4>
            <p>${medicine.category} - ${medicine.description}</p>
        </div>
    `).join('');

    // Add click handlers to result items
    const resultItems = container.querySelectorAll('.search-result-item');
    resultItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const medicine = results[index];
            searchBox.value = medicine.name;
            container.classList.remove('active');
            
            if (window.location.pathname.includes('products.html')) {
                // If on products page, scroll to the product
                scrollToProduct(medicine.name);
            } else {
                // If on other pages, redirect to products page with search param
                window.location.href = `products.html?search=${encodeURIComponent(medicine.name)}`;
            }
        });
    });
}

// Scroll to a specific product on the products page
function scrollToProduct(productName) {
    const productCards = document.querySelectorAll('.product-card h3');
    for (const card of productCards) {
        if (card.textContent.toLowerCase().includes(productName.toLowerCase())) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.closest('.product-card').style.animation = 'highlight 2s';
            break;
        }
    }
}

// Initialize mobile menu functionality
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        const spans = menuToggle.querySelectorAll('span');
        
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Initialize scroll effects
function initializeScrollEffects() {
    // Make navbar sticky
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.backgroundColor = '#ffffff';
            navbar.style.boxShadow = 'none';
        }
    });

    // Initialize scroll to top button
    const scrollToTopButton = document.getElementById('scroll-to-top');
    if (scrollToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        });

        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Add reveal animation to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => section.classList.add('reveal'));

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Add animation to cards
    const cards = document.querySelectorAll('.service-card, .product-card');
    if (cards.length > 0) {
        const cardObserverOptions = { threshold: 0.2 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, cardObserverOptions);

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
    }

    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Function to display medicines on the products page
async function displayMedicinesOnProductPage() {
    const medicineList = document.getElementById('medicine-list');
    if (!medicineList) return;

    try {
        const medicines = await loadMedicineDatabase();
        
        // Group medicines by category
        const categorizedMedicines = medicines.reduce((acc, medicine) => {
            if (!acc[medicine.category]) {
                acc[medicine.category] = [];
            }
            acc[medicine.category].push(medicine);
            return acc;
        }, {});

        // Create HTML for medicines
        const medicineHTML = Object.entries(categorizedMedicines)
            .map(([category, medicines]) => `
                <div class="category-section">
                    <h3>${category}</h3>
                    ${medicines.map(medicine => `
                        <div class="medicine-card">
                            <h3>${medicine.name}</h3>
                            <span class="category">${medicine.category}</span>
                            <p class="description">${medicine.description}</p>
                        </div>
                    `).join('')}
                </div>
            `).join('');

        medicineList.innerHTML = medicineHTML;
    } catch (error) {
        medicineList.innerHTML = '<div class="error">Failed to load medicines. Please try again later.</div>';
        console.error('Error displaying medicines:', error);
    }
}

// Function to determine current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html')) return 'home';
    if (path.includes('doctors.html')) return 'doctors';
    if (path.includes('products.html')) return 'products';
    if (path.includes('about.html')) return 'about';
    if (path.includes('contact.html')) return 'contact';
    return 'home'; // Default to home
}

// Initialize UI Components
function initializeUIComponents() {
    const currentPage = getCurrentPage();
    insertNavbar(currentPage);
    insertFooter();
}

// Initialize page features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components first
    initializeUIComponents();
    
    // Initialize common features
    initializeSearch();
    initializeMobileMenu();
    initializeScrollEffects();
    
    // Initialize page-specific features
    if (window.location.pathname.includes('products.html')) {
        displayMedicinesOnProductPage();
    }
});
