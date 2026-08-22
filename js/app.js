// js/app.js - Handles website interactivity, product rendering, and session state

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    checkUserSessionState();

    // Render featured items on homepage if container exists
    const featuredContainer = document.getElementById("featured-products");
    if (featuredContainer && typeof SIMSIM_PRODUCTS !== "undefined") {
        featuredContainer.innerHTML = SIMSIM_PRODUCTS.map(product => {
            const mainImage = (product.images && product.images.length > 0) ? product.images[0] : (product.coverImage || '');
            
            return `
                <div class="product-card">
                    <img src="${mainImage}" alt="${product.title}">
                    <div class="product-info">
                        <span class="badge">${product.category}</span>
                        <h3>${product.title}</h3>
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">${product.ageGroup}</p>
                        <div class="price">$${product.price.toFixed(2)}</div>
                        <div style="display: flex; gap: 8px; margin-top: auto;">
                            <a href="product-detail.html?id=${product.id}" class="btn" style="background: #4ECDC4; flex: 1; font-size: 0.9rem; text-align: center; text-decoration: none;">View 🔍</a>
                            <button class="btn" onclick="addToCart('${product.id}')" style="flex: 1; font-size: 0.9rem;">Buy 🛒</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
});

// Persistent Login Check & Dynamic Navigation State
function checkUserSessionState() {
    const user = localStorage.getItem("simsim_user");
    const loginNav = document.getElementById("nav-login");
    const coloringContainer = document.getElementById("nav-coloring-container");

    if (user) {
        // Change login link text to "Sign Out"
        if (loginNav) {
            loginNav.textContent = "Sign Out 🚪";
            loginNav.href = "#";
            loginNav.onclick = (e) => {
                e.preventDefault();
                logoutUser();
            };
        }

        // Check if user owns a coloring activity book
        const userLibrary = JSON.parse(localStorage.getItem(`simsim_library_${user}`)) || [];
        const hasColoringBook = userLibrary.some(item => item.type === "coloring-activity");

        if (coloringContainer) {
            if (hasColoringBook) {
                coloringContainer.innerHTML = `<a href="coloring.html" style="color: var(--primary-color); font-weight: bold;">🎨 Coloring Studio</a>`;
            } else {
                coloringContainer.innerHTML = `<a href="#" onclick="alert('Please purchase a coloring activity book from the catalog to unlock the Coloring Studio!'); return false;" style="color: #A0AEC0; cursor: not-allowed;" title="Purchase a coloring book to unlock">🎨 Coloring Studio (Locked)</a>`;
            }
        }
    } else {
        if (loginNav) {
            loginNav.textContent = "Parent Login";
            loginNav.href = "login.html";
            loginNav.onclick = null;
        }
        if (coloringContainer) {
            coloringContainer.innerHTML = `<a href="#" onclick="alert('Please log in and purchase a coloring activity book to unlock the Coloring Studio!'); return false;" style="color: #A0AEC0; cursor: not-allowed;" title="Requires Login">🎨 Coloring Studio (Locked)</a>`;
        }
    }
}

function logoutUser() {
    localStorage.removeItem("simsim_user");
    localStorage.removeItem("simsim_remember");
    alert("You have been signed out safely.");
    window.location.href = "index.html";
}

// Cart Management System using Browser LocalStorage
function getCart() {
    return JSON.parse(localStorage.getItem("simsim_cart")) || [];
}

function addToCart(productId) {
    if (!localStorage.getItem("simsim_user")) {
        alert("Please sign in before buying an item.");
        window.location.href = "login.html";
        return;
    }

    let cart = getCart();
    const product = SIMSIM_PRODUCTS.find(p => p.id === productId);
    
    if (product) {
        const cartItem = {
            ...product,
            coverImage: (product.images && product.images.length > 0) ? product.images[0] : (product.coverImage || '')
        };
        cart.push(cartItem);
        localStorage.setItem("simsim_cart", JSON.stringify(cart));
        updateCartCount();
        alert(`"${product.title}" added to your bookshelf cart! 🎈`);
    }
}

function updateCartCount() {
    const cart = getCart();
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        countEl.textContent = cart.length;
    }
}