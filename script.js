// ===== VARIABLES GLOBALES =====
let productsData = [];
let categoriesData = [];
let cart = [];

// ===== INITIALISATION DE L'APPLICATION =====

/**
 * Initialise l'application lorsque le DOM est chargé
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le panier depuis localStorage
    initializeCart();
    
    // Initialiser les fonctionnalités du panier (pour toutes les pages)
    initializeCartFunctionality();
    
    // Charger les données depuis le fichier JSON
    loadData();
});

/**
 * Charge les données des produits et catégories depuis le fichier JSON
 */
function loadData() {
    fetch('data/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            productsData = data.products;
            categoriesData = data.categories;
            
            // Initialiser l'interface après le chargement des données
            initializeInterface();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
            // Afficher un message d'erreur à l'utilisateur
            const mainContent = document.querySelector('main');
            if (mainContent) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Impossible de charger les données des produits. Veuillez réessayer plus tard.';
                mainContent.prepend(errorMessage);
            }
        });
}

/**
 * Fonction principale pour initialiser l'interface après le chargement des données
 */
function initializeInterface() {
    // Mettre à jour le compteur du panier
    updateCartCounter();
    
    // Initialiser les catégories (page d'accueil)
    initializeCategories();
    
    // Initialiser les produits (page d'accueil et page produits)
    initializeProducts();
    
    // Initialiser les fonctionnalités de filtrage et tri (page produits)
    initializeFiltersAndSorting();
}

// ===== GESTION DU PANIER =====

/**
 * Initialise le panier depuis localStorage
 */
function initializeCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCounter();
}

/**
 * Met à jour le compteur du panier dans le header
 */
function updateCartCounter() {
    const cartLinks = document.querySelectorAll('nav a[href="cart.html"]');
    cartLinks.forEach(link => {
        // Vérifier si un compteur existe déjà
        let counter = link.querySelector('.cart-counter');
        
        // Calculer le nombre total d'articles dans le panier
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        
        if (itemCount > 0) {
            // Créer ou mettre à jour le compteur
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'cart-counter';
                link.appendChild(counter);
            }
            counter.textContent = itemCount;
        } else if (counter) {
            // Supprimer le compteur s'il n'y a pas d'articles
            counter.remove();
        }
    });
}

/**
 * Initialise les fonctionnalités du panier
 */
function initializeCartFunctionality() {
    // Délégation d'événements pour les boutons d'ajout au panier
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
            addToCart(event.target);
        }
    });
    
    // Initialiser la page du panier si nous sommes sur cette page
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (cartItemsContainer && cartTotalElement) {
        renderCart();
    }
    
    // Ajouter un écouteur d'événement pour le bouton de paiement
    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', processCheckout);
    }
}

/**
 * Ajoute un produit au panier
 * @param {HTMLElement} button - Le bouton d'ajout au panier qui a été cliqué
 */
function addToCart(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard.querySelector('h3').textContent;
    const productImage = productCard.querySelector('img').src;
    const priceElement = productCard.querySelector('.price');
    const productPriceText = priceElement ? priceElement.textContent : '0';
    const priceMatch = productPriceText.match(/(\d+\.?\d*)/); 
    const productPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const productUnit = productPriceText.includes('/') ? productPriceText.split('/ ')[1] : 'unité';
    
    // Vérifier si le produit est déjà dans le panier
    const existingProductIndex = cart.findIndex(item => item.name === productName);
    
    if (existingProductIndex !== -1) {
        // Incrémenter la quantité si le produit existe déjà
        cart[existingProductIndex].quantity += 1;
    } else {
        // Ajouter le nouveau produit au panier
        cart.push({
            name: productName,
            price: productPrice,
            image: productImage,
            unit: productUnit,
            quantity: 1
        });
    }
    
    // Sauvegarder le panier dans localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Mettre à jour le compteur du panier
    updateCartCounter();
    
    // Afficher un message de confirmation
    showNotification(`${productName} a été ajouté à votre panier !`);
}

/**
 * Affiche une notification temporaire
 * @param {string} message - Le message à afficher
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Faire disparaître la notification après 3 secondes
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2500);
}


/**
 * Met à jour l'affichage du panier
 */
function renderCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) return;
    
    // Vider le conteneur
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        // Afficher un message si le panier est vide avec une icône
        const emptyCartMessage = document.createElement('div');
        emptyCartMessage.className = 'empty-cart-message';
        emptyCartMessage.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <p>Votre panier est vide</p>
            <a href="products.html" class="btn">Parcourir les produits</a>
        `;
        cartItemsContainer.appendChild(emptyCartMessage);
        cartTotalElement.textContent = '0.00MGA';
        return;
    }
    
    // Calculer le total du panier
    let total = 0;
    
    // Créer un élément pour chaque article du panier
    cart.forEach((item, index) => {
        const cartItem = createCartItemElement(item, index);
        cartItemsContainer.appendChild(cartItem);
        
        // Ajouter au total
        total += item.price * item.quantity;
    });
    
    // Mettre à jour le total affiché
    cartTotalElement.textContent = `${total.toFixed(1)}MGA`;

}

/**
 * Crée un élément pour un article du panier
 * @param {Object} item - L'article du panier
 * @param {number} index - L'index de l'article dans le panier
 * @returns {HTMLElement} - L'élément créé
 */
function createCartItemElement(item, index) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    const itemImage = document.createElement('img');
    itemImage.src = item.image;
    itemImage.alt = item.name;
    
    const itemDetails = document.createElement('div');
    itemDetails.className = 'item-details';
    
    const itemName = document.createElement('h3');
    itemName.textContent = item.name;
    
    const itemPrice = document.createElement('p');
    itemPrice.className = 'item-price';
    itemPrice.textContent = `${item.price.toFixed(1)}MGA/ ${item.unit}`;
    
    const quantityControls = createQuantityControls(index);
    
    const itemTotal = document.createElement('p');
    itemTotal.className = 'item-total';
    const itemTotalPrice = item.price * item.quantity;
    itemTotal.textContent = `Total: ${itemTotalPrice.toFixed(1)}MGA`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.textContent = 'Supprimer';
    removeBtn.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article de votre panier ?')) {
            removeCartItem(index);
            showNotification('Article supprimé du panier', 'success');
        }
    });
    
    // Assembler l'élément
    itemDetails.appendChild(itemName);
    itemDetails.appendChild(itemPrice);
    itemDetails.appendChild(quantityControls);
    itemDetails.appendChild(itemTotal);
    itemDetails.appendChild(removeBtn);
    
    cartItem.appendChild(itemImage);
    cartItem.appendChild(itemDetails);
    
    return cartItem;
}

/**
 * Crée les contrôles de quantité pour un article du panier
 * @param {number} index - L'index de l'article dans le panier
 * @returns {HTMLElement} - L'élément créé
 */
function createQuantityControls(index) {
    const quantityControls = document.createElement('div');
    quantityControls.className = 'quantity-controls';
    
    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-';
    decreaseBtn.addEventListener('click', function() {
        decreaseCartItemQuantity(index);
    });
    
    const quantityDisplay = document.createElement('span');
    quantityDisplay.textContent = cart[index].quantity;
    
    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+';
    increaseBtn.addEventListener('click', function() {
        increaseCartItemQuantity(index);
    });
    
    quantityControls.appendChild(decreaseBtn);
    quantityControls.appendChild(quantityDisplay);
    quantityControls.appendChild(increaseBtn);
    
    return quantityControls;
}

/**
 * Diminue la quantité d'un article du panier
 * @param {number} index - L'index de l'article dans le panier
 */
function decreaseCartItemQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        updateCartAndUI();
        showNotification('Quantité diminuée', 'info');
    } else {
        if (confirm('Diminuer la quantité supprimera cet article. Continuer ?')) {
            cart[index].quantity -= 1;
            updateCartAndUI();
            showNotification('Article supprimé du panier', 'success');
        }
    }
}

/**
 * Augmente la quantité d'un article du panier
 * @param {number} index - L'index de l'article dans le panier
 */
function increaseCartItemQuantity(index) {
    cart[index].quantity += 1;
    updateCartAndUI();
    showNotification('Quantité augmentée', 'info');
}

/**
 * Supprime un article du panier
 * @param {number} index - L'index de l'article dans le panier
 */
function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartAndUI();
}

/**
 * Met à jour le panier dans localStorage et rafraîchit l'UI
 */
function updateCartAndUI() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCounter();
}

// ===== GESTION DES CATÉGORIES =====

/**
 * Initialise l'affichage des catégories
 */
function initializeCategories() {
    const categoriesContainer = document.querySelector('.categories');
    const hiddenCategoriesContainer = document.querySelector('.hidden-categories');
    
    if (categoriesContainer && categoriesData.length > 0) {
        // Vider le conteneur des catégories existantes
        categoriesContainer.innerHTML = '';
        
        // Afficher les 3 premières catégories dans le conteneur principal
        const visibleCategories = categoriesData.slice(0, 3);
        visibleCategories.forEach(category => {
            categoriesContainer.appendChild(createCategoryCard(category));
        });
        
        // Afficher les catégories restantes dans le conteneur caché
        if (hiddenCategoriesContainer && categoriesData.length > 3) {
            hiddenCategoriesContainer.innerHTML = '';
            
            const hiddenCategories = categoriesData.slice(3);
            hiddenCategories.forEach(category => {
                hiddenCategoriesContainer.appendChild(createCategoryCard(category));
            });
            
            // Fonctionnalité pour afficher/masquer les catégories supplémentaires
            initializeShowMoreCategoriesButton(hiddenCategoriesContainer);
        }
    }
}

/**
 * Initialise le bouton "Voir plus de catégories"
 * @param {HTMLElement} hiddenCategoriesContainer - Le conteneur des catégories cachées
 */
function initializeShowMoreCategoriesButton(hiddenCategoriesContainer) {
    const showMoreBtn = document.getElementById('showMoreCategoriesBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            if (hiddenCategoriesContainer.style.display === 'flex') {
                hiddenCategoriesContainer.style.display = 'none';
                showMoreBtn.textContent = 'Voir plus de catégories';
            } else {
                hiddenCategoriesContainer.style.display = 'flex';
                showMoreBtn.textContent = 'Voir moins de catégories';
            }
        });
    }
}

/**
 * Crée une carte de catégorie
 * @param {Object} category - Les données de la catégorie
 * @returns {HTMLElement} - L'élément créé
 */
function createCategoryCard(category) {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    
    const img = document.createElement('img');
    img.src = category.image;
    img.alt = category.name;
    
    const h3 = document.createElement('h3');
    h3.textContent = category.name;
    
    const p = document.createElement('p');
    p.textContent = category.description;
    
    categoryCard.appendChild(img);
    categoryCard.appendChild(h3);
    categoryCard.appendChild(p);
    
    // Ajouter un lien vers la page des produits filtrée par cette catégorie
    categoryCard.addEventListener('click', function() {
        window.location.href = `products.html?category=${category.id}`;
    });
    
    return categoryCard;
}

// ===== GESTION DES PRODUITS =====

/**
 * Initialise les produits
 */
function initializeProducts() {
    // Vérifier si nous sommes sur la page d'accueil (produits phares) ou la page des produits
    const featuredProductsGrid = document.querySelector('#featured-products .product-grid');
    const productsGrid = document.querySelector('.product-grid:not(#featured-products .product-grid)');
    
    // Récupérer la catégorie depuis l'URL si elle existe
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    // Initialiser les produits phares sur la page d'accueil
    if (featuredProductsGrid) {
        initializeFeaturedProducts(featuredProductsGrid);
    }
    
    // Initialiser tous les produits sur la page des produits
    if (productsGrid) {
        initializeAllProducts(productsGrid, categoryParam);
    }
}

/**
 * Initialise les produits phares sur la page d'accueil
 * @param {HTMLElement} container - Le conteneur des produits phares
 */
function initializeFeaturedProducts(container) {
    // Vider le conteneur
    container.innerHTML = '';
    
    // Filtrer les produits phares
    const featuredProducts = productsData.filter(product => product.featured);
    
    // Afficher les produits phares
    featuredProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

/**
 * Initialise tous les produits sur la page des produits
 * @param {HTMLElement} container - Le conteneur des produits
 * @param {string|null} categoryParam - La catégorie sélectionnée (si présente)
 */
function initializeAllProducts(container, categoryParam) {
    // Vider le conteneur
    container.innerHTML = '';
    
    // Filtrer les produits par catégorie si un paramètre est présent dans l'URL
    let filteredProducts = productsData;
    if (categoryParam) {
        filteredProducts = productsData.filter(product => product.category === categoryParam);
        
        // Mettre à jour le filtre de catégorie si présent
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.value = categoryParam;
        }
    }
    
    // Afficher tous les produits
    filteredProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

/**
 * Crée une carte de produit
 * @param {Object} product - Les données du produit
 * @returns {HTMLElement} - L'élément créé
 */
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.category = product.category;
    productCard.dataset.price = product.price;
    productCard.dataset.name = product.name;
    
    // Créer les badges
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'product-badges';
    
    if (product.badges && product.badges.length > 0) {
        product.badges.forEach(badge => {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `badge ${badge}`;
            badgeSpan.textContent = badge.charAt(0).toUpperCase() + badge.slice(1);
            badgesDiv.appendChild(badgeSpan);
        });
    }
    
    // Créer l'image
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    
    // Créer le titre
    const h3 = document.createElement('h3');
    h3.textContent = product.name;
    
    // Créer la description
    const description = document.createElement('p');
    description.textContent = product.description;
    
    // Créer les détails du produit
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'product-details';
    
    const origin = document.createElement('span');
    origin.className = 'origin';
    origin.textContent = `Origine: ${product.origin}`;
    
    const distance = document.createElement('span');
    distance.className = 'distance';
    distance.textContent = `À ${product.distance}km`;
    
    detailsDiv.appendChild(origin);
    detailsDiv.appendChild(distance);
    
    // Créer le prix
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = `${product.price.toFixed(0)} MGA / ${product.unit}`;
    
    // Créer le bouton d'ajout au panier
    const addButton = document.createElement('button');
    addButton.className = 'add-to-cart';
    addButton.textContent = 'Ajouter au panier';
    
    // Assembler la carte
    productCard.appendChild(badgesDiv);
    productCard.appendChild(img);
    productCard.appendChild(h3);
    productCard.appendChild(description);
    productCard.appendChild(detailsDiv);
    productCard.appendChild(price);
    productCard.appendChild(addButton);
    
    return productCard;
}

// ===== FILTRAGE ET TRI DES PRODUITS =====

/**
 * Initialise les fonctionnalités de filtrage et tri
 */
function initializeFiltersAndSorting() {
    const productSearch = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');
    const productGrid = document.querySelector('.product-grid:not(#featured-products .product-grid)');
    
    // Initialiser le filtre de catégories
    if (categoryFilter && categoriesData.length > 0) {
        initializeCategoryFilter(categoryFilter);
    }
    
    if (productSearch && categoryFilter && sortBy && productGrid) {
        // Fonction pour filtrer et trier les produits
        function filterAndSortProducts() {
            const searchTerm = productSearch.value.toLowerCase();
            const selectedCategory = categoryFilter.value;
            const sortOption = sortBy.value;
            
            // Récupérer toutes les cartes de produits
            const productCards = Array.from(productGrid.querySelectorAll('.product-card'));
            
            // Filtrer les produits
            filterProducts(productCards, searchTerm, selectedCategory);
            
            // Trier les produits visibles
            sortProducts(productGrid, productCards, sortOption);
            
            // Afficher un message si aucun produit ne correspond
            updateNoResultsMessage(productGrid, productCards);
        }
        
        // Ajouter les écouteurs d'événements
        productSearch.addEventListener('input', filterAndSortProducts);
        categoryFilter.addEventListener('change', filterAndSortProducts);
        sortBy.addEventListener('change', filterAndSortProducts);
        
        // Appliquer les filtres et tri initiaux
        filterAndSortProducts();
    }
}

/**
 * Initialise le filtre de catégories
 * @param {HTMLElement} categoryFilter - L'élément select pour le filtre de catégories
 */
function initializeCategoryFilter(categoryFilter) {
    // Vider les options existantes
    categoryFilter.innerHTML = '';
    
    // Ajouter l'option "Toutes les catégories"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Toutes les catégories';
    categoryFilter.appendChild(allOption);
    
    // Ajouter une option pour chaque catégorie
    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

/**
 * Filtre les produits selon les critères de recherche et de catégorie
 * @param {Array} productCards - Les cartes de produits
 * @param {string} searchTerm - Le terme de recherche
 * @param {string} selectedCategory - La catégorie sélectionnée
 */
function filterProducts(productCards, searchTerm, selectedCategory) {
    productCards.forEach(card => {
        // Filtrage par recherche
        const productName = card.querySelector('h3').textContent.toLowerCase();
        const productDescription = card.querySelector('p').textContent.toLowerCase();
        const matchesSearch = productName.includes(searchTerm) || productDescription.includes(searchTerm);
        
        // Filtrage par catégorie
        const productCategory = card.dataset.category;
        const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
        
        // Afficher ou masquer la carte selon les filtres
        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Trie les produits selon l'option sélectionnée
 * @param {HTMLElement} productGrid - Le conteneur des produits
 * @param {Array} productCards - Les cartes de produits
 * @param {string} sortOption - L'option de tri sélectionnée
 */
function sortProducts(productGrid, productCards, sortOption) {
    const visibleCards = productCards.filter(card => card.style.display !== 'none');
    
    switch (sortOption) {
        case 'price-asc':
            visibleCards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
            break;
        case 'price-desc':
            visibleCards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
            break;
        case 'name-asc':
            visibleCards.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
            break;
        case 'name-desc':
            visibleCards.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
            break;
        default:
            // Par défaut, ne rien faire
            break;
    }
    
    // Réorganiser les cartes dans la grille
    visibleCards.forEach(card => {
        productGrid.appendChild(card);
    });
}

/**
 * Met à jour le message "Aucun résultat" si nécessaire
 * @param {HTMLElement} productGrid - Le conteneur des produits
 * @param {Array} productCards - Les cartes de produits
 */
function updateNoResultsMessage(productGrid, productCards) {
    const visibleCards = productCards.filter(card => card.style.display !== 'none');
    const noResultsMessage = document.getElementById('no-results-message');
    
    if (visibleCards.length === 0) {
        if (!noResultsMessage) {
            const message = document.createElement('p');
            message.id = 'no-results-message';
            message.className = 'no-results';
            message.textContent = 'Aucun produit ne correspond à votre recherche.';
            productGrid.appendChild(message);
        }
    } else if (noResultsMessage) {
        noResultsMessage.remove();
    }
}


// Ouvre la modale
document.querySelector('.checkout-button').addEventListener('click', () => {
  document.getElementById('paymentModal').style.display = 'flex';
});

// Ferme la modale
document.getElementById('closeModalBtn').addEventListener('click', () => {
  document.getElementById('paymentModal').style.display = 'none';
});

// Affiche ou cache les champs carte selon la méthode
document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
  input.addEventListener('change', () => {
    const cardSection = document.getElementById('cardDetails');
    cardSection.style.display = input.value === 'card' ? 'block' : 'none';
  });
});

// Soumission du formulaire
document.getElementById('paymentForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Simuler un paiement
  alert("Paiement effectué avec succès ! Merci pour votre achat.");

  // Vider le panier
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartAndUI();

  // Fermer la modale
  document.getElementById('paymentModal').style.display = 'none';
});
