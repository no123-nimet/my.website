// ===== NETLIFY FUNCTIONS CONFIGURATION =====
// No API keys needed - they're safely stored on Netlify!

// ===== FALLBACK PRODUCTS (if Netlify function fails) =====
const fallbackProducts = [
    { id: 1, name: 'Elegant Gold Gown', price: 10000, category: 'gowns', badge: 'New', image: 'images/placeholder.jpg' },
    { id: 2, name: 'Classic Black Blazer', price: 12000, category: 'blazers', badge: 'Best Seller', image: 'images/placeholder.jpg' },
    { id: 3, name: 'Summer Maxi Dress', price: 9000, category: 'dresses', badge: 'Sale', image: 'images/placeholder.jpg' },
    { id: 4, name: 'Evening Abaya', price: 7000, category: 'gowns', badge: 'Premium', image: 'images/placeholder.jpg' },
    { id: 5, name: 'Tailored Blazer', price: 20000, category: 'blazers', badge: 'New', image: 'images/placeholder.jpg' },
    { id: 6, name: 'Floral Print Dress', price: 5000, category: 'dresses', badge: '', image: 'dress1.jpeg'},
    { id: 7, name: 'Blue half khimar', price: 11000, category: 'hijabs', badge: 'new', image: 'images/placeholder.jpg' },
];

// ===== GLOBAL VARIABLES =====
let cart = [];
let currentProduct = null;
let currentQty = 1;
let selectedSize = null;
let selectedColor = null;
let selectedAccessories = [];
let currentOrderNumber = '';
let deliveryInfo = {};
let paymentInfo = {};
let products = []; // Will be populated from Netlify function

// Cache DOM elements
const domElements = {
    overlay: document.getElementById('overlay'),
    cartSidebar: document.getElementById('cartSidebar'),
    miniCart: document.getElementById('miniCart'),
    productModal: document.getElementById('productModal'),
    cartCount: document.getElementById('cartCount'),
    mobileCartCount: document.getElementById('mobileCartCount'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutModal: document.getElementById('checkoutModal')
};

// ===== LOAD PRODUCTS FROM NETLIFY FUNCTION =====
async function loadProductsFromNetlify() {
    // Check if we're on a live site or local file
    const isLocal = location.protocol === 'file:';

    if (isLocal) {
        console.log('Running locally – using fallback products');
        products = fallbackProducts;
        displayProducts(products);
        return;
    }

    // Try Netlify function
    try {
        const response = await fetch('https://nimet-website.netlify.app/.netlify/functions/products');
        const data = await response.json();
        products = data.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                name: fields['Product name'] || 'Unnamed Product',
                price: fields.Price || 0,
                category: fields.Category || 'uncategorized',
                badge: fields.Badge || '',
                image: fields.Image?.[0]?.url || 'images/placeholder.jpg',
                description: fields.Description || '',
                sku: fields.SKU || '',
                inStock: fields['In stock'] || false
            };
        });
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching Netlify function – using fallback', error);
        products = fallbackProducts;
        displayProducts(products);
    }
}

// ===== INITIALIZE ON PAGE LOAD ===== (ONLY ONE!)
document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromNetlify();
    startCountdown();
    loadCartFromStorage();
    updateCartDisplay();
    setupEventListeners();
    setupCheckoutListeners();
});

// ===== CHECKOUT MODAL FUNCTIONS =====
function openCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.add('show');
        document.getElementById('overlay').classList.add('show');
        resetCheckout();
        generateOrderNumber();
    }
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function resetCheckout() {
    document.getElementById('deliveryStep').style.display = 'block';
    document.getElementById('paymentStep').style.display = 'none';
    document.getElementById('reviewStep').style.display = 'none';
    
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
}

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    currentOrderNumber = `NMT-${year}${month}${day}-${random}`;
    const orderDisplay = document.getElementById('orderNumberDisplay');
    if (orderDisplay) orderDisplay.textContent = currentOrderNumber;
}

// ===== SETUP CHECKOUT LISTENERS =====
function setupCheckoutListeners() {
    // Toggle between Nigeria and International
    document.querySelectorAll('input[name="locationType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const nigeriaForm = document.getElementById('nigeriaForm');
            const internationalForm = document.getElementById('internationalForm');
            
            if (this.value === 'nigeria') {
                nigeriaForm.style.display = 'block';
                internationalForm.style.display = 'none';
                document.getElementById('nigeriaState').required = true;
                document.getElementById('lga').required = true;
                document.getElementById('nigeriaAddress').required = true;
                document.getElementById('country').required = false;
                document.getElementById('internationalState').required = false;
                document.getElementById('city').required = false;
                document.getElementById('postalCode').required = false;
                document.getElementById('internationalAddress').required = false;
            } else {
                nigeriaForm.style.display = 'none';
                internationalForm.style.display = 'block';
                document.getElementById('nigeriaState').required = false;
                document.getElementById('lga').required = false;
                document.getElementById('nigeriaAddress').required = false;
                document.getElementById('country').required = true;
                document.getElementById('internationalState').required = true;
                document.getElementById('city').required = true;
                document.getElementById('postalCode').required = true;
                document.getElementById('internationalAddress').required = true;
            }
        });
    });

    // Toggle Payment Details
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('cardDetails').style.display = 'none';
            document.getElementById('transferDetails').style.display = 'none';
            document.getElementById('cashDetails').style.display = 'none';
            
            if (this.value === 'card') {
                document.getElementById('cardDetails').style.display = 'block';
            } else if (this.value === 'transfer') {
                document.getElementById('transferDetails').style.display = 'block';
            } else if (this.value === 'cash') {
                document.getElementById('cashDetails').style.display = 'block';
            }
        });
    });

    // Proceed to Payment button
    document.getElementById('toPaymentBtn')?.addEventListener('click', function() {
        const locationType = document.querySelector('input[name="locationType"]:checked').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('deliveryEmail').value;
        
        if (!phone || !email) {
            showNotification('Please fill phone and email', 'error');
            return;
        }
        
        if (locationType === 'nigeria') {
            const state = document.getElementById('nigeriaState').value;
            const lga = document.getElementById('lga').value;
            const address = document.getElementById('nigeriaAddress').value;
            
            if (!state || !lga || !address) {
                showNotification('Please fill all Nigeria delivery fields', 'error');
                return;
            } else {
                deliveryInfo = {
                    type: 'nigeria',
                    state: state,
                    lga: lga,
                    address: address,
                    phone: phone,
                    email: email
                };
            }
        } else {
            const country = document.getElementById('country').value;
            const state = document.getElementById('internationalState').value;
            const city = document.getElementById('city').value;
            const postal = document.getElementById('postalCode').value;
            const address = document.getElementById('internationalAddress').value;
            
            if (!country || !state || !city || !postal || !address) {
                showNotification('Please fill all international delivery fields', 'error');
                return;
            } else {
                deliveryInfo = {
                    type: 'international',
                    country: country,
                    state: state,
                    city: city,
                    postal: postal,
                    address: address,
                    phone: phone,
                    email: email
                };
            }
        }
        
        // Move to payment step
        document.getElementById('deliveryStep').style.display = 'none';
        document.getElementById('paymentStep').style.display = 'block';
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    });

    // Back to Delivery button
    document.getElementById('backToDeliveryBtn')?.addEventListener('click', function() {
        document.getElementById('paymentStep').style.display = 'none';
        document.getElementById('deliveryStep').style.display = 'block';
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step1').classList.add('active');
    });

    // Proceed to Review button
    document.getElementById('toReviewBtn')?.addEventListener('click', function() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        
        if (!paymentMethod) {
            showNotification('Please select a payment method', 'error');
            return;
        }
        
        paymentInfo = { method: paymentMethod };
        updateReview();
        
        document.getElementById('paymentStep').style.display = 'none';
        document.getElementById('reviewStep').style.display = 'block';
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.add('active');
    });

    // Back to Payment button
    document.getElementById('backToPaymentBtn')?.addEventListener('click', function() {
        document.getElementById('reviewStep').style.display = 'none';
        document.getElementById('paymentStep').style.display = 'block';
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step2').classList.add('active');
    });

    // Place Order button
    document.getElementById('placeOrderBtn')?.addEventListener('click', function() {
        showNotification(`Order ${currentOrderNumber} placed successfully!`, 'success');
        cart = [];
        saveCartToStorage();
        updateCartDisplay();
        closeCheckout();
    });
}

// ===== UPDATE REVIEW FUNCTION =====
function updateReview() {
    const reviewItems = document.getElementById('reviewItems');
    const reviewAddress = document.getElementById('reviewAddress');
    const reviewPayment = document.getElementById('reviewPayment');
    const reviewTotal = document.getElementById('reviewTotal');
    
    // Show items
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <div class="review-item">
                <span>${item.name} x${item.quantity || 1}</span>
                <span>₦${(item.total || item.price).toLocaleString()}</span>
            </div>
        `;
    });
    if (reviewItems) reviewItems.innerHTML = itemsHtml;
    
    // Show address
    if (deliveryInfo.type === 'nigeria') {
        reviewAddress.innerHTML = `
            <p>${deliveryInfo.address}</p>
            <p>${deliveryInfo.lga}, ${deliveryInfo.state}, Nigeria</p>
            <p>Phone: ${deliveryInfo.phone}</p>
        `;
    } else {
        reviewAddress.innerHTML = `
            <p>${deliveryInfo.address}</p>
            <p>${deliveryInfo.city}, ${deliveryInfo.state}, ${deliveryInfo.country} ${deliveryInfo.postal}</p>
            <p>Phone: ${deliveryInfo.phone}</p>
        `;
    }
    
    // Show payment method
    let paymentText = '';
    if (paymentInfo.method === 'card') paymentText = 'Credit/Debit Card';
    else if (paymentInfo.method === 'transfer') paymentText = 'Bank Transfer';
    else paymentText = 'Cash on Delivery';
    if (reviewPayment) reviewPayment.innerHTML = `<p>${paymentText}</p>`;
    
    // Show total
    const total = calculateCartTotal();
    if (reviewTotal) reviewTotal.innerHTML = `<p class="total-amount">Total: ₦${total.toLocaleString()}</p>`;
}

// ===== PRODUCT FUNCTIONS =====
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Crect width=\'300\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'150\' y=\'150\' font-family=\'Arial\' font-size=\'16\' fill=\'%23999\' text-anchor=\'middle\' dy=\'.3em\'%3ENo Image%3C/text%3E%3C/svg%3E';

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!productsToShow || productsToShow.length === 0) {
        grid.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }
    
    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const imageSrc = product.image || PLACEHOLDER_IMAGE;
        
        card.innerHTML = 
            '<div class="product-image">' +
                '<img src="' + imageSrc + '" ' +
                     'alt="' + product.name + '" ' +
                     'loading="lazy" ' +
                     'onerror="this.src=\'' + PLACEHOLDER_IMAGE + '\'">' +
            '</div>' +
            '<div class="product-info">' +
                '<h3 class="product-name">' + product.name + '</h3>' +
                '<p class="product-price">₦' + product.price.toLocaleString() + '</p>' +
                (product.badge ? '<span class="product-badge">' + product.badge + '</span>' : '') +
                '<button class="btn btn-outline view-product" data-id="' + product.id + '">View</button>' +
            '</div>';
        
        grid.appendChild(card);
    });
    
    document.querySelectorAll('.view-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            openProductModal(productId);
        });
    });    
}

// ===== HELPER FUNCTIONS =====
function validateEmail(email) {
    if (!email) return false;
    if (email.indexOf('@') === -1) return false;
    if (email.indexOf('.') === -1) return false;
    return email.length > 5;
}

function validateQuantity(qty) {
    return !isNaN(qty) && qty >= 1 && qty <= 10;
}

function formatPrice(price) {
    return '₦' + price;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showButtonLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
}

function hideButtonLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

function calculateCartTotal() {
    return cart.reduce((total, item) => {
        let itemTotal = item.price * (item.quantity || 1);
        if (item.accessories && item.accessories.length) {
            itemTotal += item.accessories.length * 29000;
        }
        return total + itemTotal;
    }, 0);
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCartToStorage();
        updateCartDisplay();
        showNotification('Cart cleared', 'info');
    }
}

function trackEvent(category, action, label) {
    console.log(`Track: ${category} - ${action} - ${label}`);
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('hamburger').addEventListener('click', toggleMobileMenu);
    
    const debouncedFilter = debounce(filterProducts, 300);
    document.getElementById('searchInput').addEventListener('input', debouncedFilter);
    document.getElementById('categorySelect').addEventListener('change', filterProducts);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.getElementById('overlay').addEventListener('click', function() {
        closeAllModals();
        document.getElementById('cartSidebar').classList.remove('show');
        document.getElementById('miniCart').classList.remove('show');
        this.classList.remove('show');
    });
    
    document.getElementById('cartLink').addEventListener('click', function(e) {
        e.preventDefault();
        openCartSidebar();
    });
    
    document.getElementById('increaseQty')?.addEventListener('click', increaseQuantity);
    document.getElementById('decreaseQty')?.addEventListener('click', decreaseQuantity);
    document.getElementById('addToCartBtn')?.addEventListener('click', addToCartFromModal);
    document.getElementById('buyNowBtn')?.addEventListener('click', buyNow);
    
    document.getElementById('continueShopping')?.addEventListener('click', function() {
        document.getElementById('miniCart').classList.remove('show');
    });
    
    document.getElementById('checkoutBtn')?.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        openCheckoutModal();
    });
    
    document.getElementById('checkoutSidebarBtn')?.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            return;
        }
        openCheckoutModal();
    });
    
    document.querySelector('.close-mini-cart')?.addEventListener('click', function() {
        document.getElementById('miniCart').classList.remove('show');
    });
    
    document.querySelector('.close-cart')?.addEventListener('click', function() {
        document.getElementById('cartSidebar').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    });
    
    document.getElementById('returnLink')?.addEventListener('click', function(e) {
        e.preventDefault();
        openReturnModal();
    });
    
    document.getElementById('cancelAdmin')?.addEventListener('click', closeAllModals);
    document.getElementById('cancelReturn')?.addEventListener('click', closeAllModals);
    
    document.getElementById('reviewForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your review!');
        this.reset();
    });
    
    document.getElementById('adminForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        authenticateAdmin();
    });
    
    document.getElementById('returnForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReturnRequest();
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#' && href !== '') {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', function() {
            closeMobileMenu();
        });
    });
}

// ===== MODAL INTERACTIONS =====
function increaseQuantity() {
    currentQty = Math.min(currentQty + 1, 10);
    const quantityEl = document.getElementById('quantity');
    if (quantityEl) quantityEl.value = currentQty;
}

function decreaseQuantity() {
    currentQty = Math.max(currentQty - 1, 1);
    const quantityEl = document.getElementById('quantity');
    if (quantityEl) quantityEl.value = currentQty;
}

function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;
    
    currentQty = 1;
    selectedSize = null;
    selectedColor = null;
    selectedAccessories = [];
    
    const titleEl = document.getElementById('modalProductTitle');
    const priceEl = document.getElementById('modalProductPrice');
    const quantityEl = document.getElementById('quantity');
    const modalImage = document.querySelector('.modal-image');
    
    if (titleEl) titleEl.textContent = currentProduct.name;
    if (priceEl) priceEl.textContent = `₦${currentProduct.price.toLocaleString()}`;
    if (quantityEl) quantityEl.value = currentQty;
    
    if (modalImage) {
        const imageSrc = currentProduct.image || PLACEHOLDER_IMAGE;
        modalImage.innerHTML = `<img src="${imageSrc}" 
                                  alt="${currentProduct.name}" 
                                  style="width:100%; height:100%; object-fit:cover;"
                                  onerror="this.src='${PLACEHOLDER_IMAGE}'">`;
    }
    
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('input[name="color"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('.accessory-options input').forEach(cb => cb.checked = false);
    
    const productModal = document.getElementById('productModal');
    const overlay = document.getElementById('overlay');
    if (productModal) productModal.classList.add('show');
    if (overlay) overlay.classList.add('show');
    
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedSize = this.getAttribute('data-size');
        };
    });
    
    document.querySelectorAll('input[name="color"]').forEach(radio => {
        radio.onchange = function() {
            selectedColor = this.value;
        };
    });
   
    document.querySelectorAll('.accessory-options input').forEach(cb => {
        cb.onchange = function() {
            if (this.checked) {
                selectedAccessories.push(this.value);
            } else {
                selectedAccessories = selectedAccessories.filter(a => a !== this.value);
            }
        };
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.getElementById('overlay').classList.remove('show');
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('hamburger');
    
    if (mobileMenu && hamburger) {
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

// ===== CART FUNCTIONS =====
function addToCartFromModal() {
    if (!selectedSize) {
        showNotification('Please select a size', 'error');
        return;
    }
    
    if (!selectedColor) {
        showNotification('Please select a color', 'error');
        return;
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        size: selectedSize,
        color: selectedColor,
        accessories: selectedAccessories,
        quantity: currentQty,
        total: currentProduct.price * currentQty
    };
    
    cart.push(cartItem);
    saveCartToStorage();
    updateCartDisplay();
    showMiniCart(cartItem);
    closeAllModals();
    showNotification('Item added to cart!', 'success');
}

function addToCart(product) {
    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
    };
    
    cart.push(cartItem);
    saveCartToStorage();
    updateCartDisplay();
    showMiniCart(cartItem);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartDisplay();
}

function updateCartDisplay() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (domElements.cartCount) domElements.cartCount.textContent = count;
    if (domElements.mobileCartCount) domElements.mobileCartCount.textContent = count;
    
    if (domElements.cartItems) {
        if (cart.length === 0) {
            domElements.cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (domElements.cartTotal) domElements.cartTotal.textContent = '₦0';
        } else {
            let html = '';
            let total = 0;
            
            cart.forEach((item, index) => {
                const itemTotal = item.total || (item.price * (item.quantity || 1));
                total += itemTotal;
                html += `
                    <div class="cart-item">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>₦${item.price.toLocaleString()} x ${item.quantity || 1}</p>
                            ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                            ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                        </div>
                        <button class="remove-item" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            
            domElements.cartItems.innerHTML = html;
            if (domElements.cartTotal) domElements.cartTotal.textContent = `₦${total.toLocaleString()}`;
            
            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    removeFromCart(index);
                });
            });
        }
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem('nimetCart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Failed to save cart:', e);
        showNotification('Unable to save cart', 'info');
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('nimetCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.warn('Failed to load cart:', e);
        cart = [];
    }
}

// ===== MINI CART FUNCTIONS =====
function showMiniCart(item) {
    if (!domElements.miniCart) return;
    
    const miniCartItem = document.getElementById('miniCartItem');
    if (miniCartItem) {
        miniCartItem.innerHTML = `
            <h4>${item.name}</h4>
            <p>Quantity: ${item.quantity || 1}</p>
            <p>Price: ₦${(item.total || item.price).toLocaleString()}</p>
            ${item.size ? `<p>Size: ${item.size}</p>` : ''}
            ${item.color ? `<p>Color: ${item.color}</p>` : ''}
        `;
    }
    
    domElements.miniCart.classList.add('show');
    
    setTimeout(() => {
        if (domElements.miniCart) domElements.miniCart.classList.remove('show');
    }, 4000);
}

// ===== CART SIDEBAR FUNCTIONS =====
function openCartSidebar() {
    if (domElements.cartSidebar) {
        domElements.cartSidebar.classList.add('show');
        if (domElements.overlay) domElements.overlay.classList.add('show');
        updateCartDisplay();
    }
}

// ===== CHECKOUT FUNCTIONS =====
function buyNow() {
    addToCartFromModal();
    setTimeout(() => {
        openCartSidebar();
    }, 500);
}

function placeOrder() {
    const orderId = generateOrderId();
    showNotification(`Order #${orderId} placed successfully!`, 'success');
    cart = [];
    saveCartToStorage();
    updateCartDisplay();
    closeAllModals();
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-8);
}

// ===== SEARCH & FILTER FUNCTIONS =====
function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const category = categorySelect ? categorySelect.value : 'all';
    
    const filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    displayProducts(filtered);
}

// ===== HAMBURGER MENU FUNCTIONS =====
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('hamburger');
    
    if (mobileMenu && hamburger) {
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        
        const spans = hamburger.querySelectorAll('span');
        if (hamburger.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
}

// ===== COUNTDOWN TIMER =====
function startCountdown() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    function updateTimer() {
        const now = new Date();
        const diff = endDate - now;
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (diff <= 0) {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// ===== ADMIN FUNCTIONS =====
function showAdminLogin() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.classList.add('show');
        if (domElements.overlay) domElements.overlay.classList.add('show');
    }
}

function authenticateAdmin() {
    showNotification('Admin login successful!', 'success');
    closeAllModals();
}

// ===== RETURN FUNCTIONS =====
function openReturnModal() {
    const returnModal = document.getElementById('returnModal');
    if (returnModal) {
        returnModal.classList.add('show');
        if (domElements.overlay) domElements.overlay.classList.add('show');
    }
}

function submitReturnRequest() {
    showNotification('Return request submitted successfully!', 'success');
    closeAllModals();
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
    `;
    
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '3000';
    notification.style.animation = 'slideInRight 0.3s ease';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(50px); }
    }
`;
if (!document.querySelector('style[data-cart-style]')) {
    style.setAttribute('data-cart-style', 'true');
    document.head.appendChild(style);
}
