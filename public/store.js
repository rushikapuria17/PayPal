if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger');
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i];
        button.addEventListener('click', removeCartItem);
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity');
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i];
        input.addEventListener('change', quantityChanged);
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button');
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i];
        button.addEventListener('click', addToCartClicked);
    }
}

async function addToCartClicked(event) {
    var button = event.target;
    var shopItem = button.closest('.shop-item');
    var productName = shopItem.getElementsByClassName('shop-item-title')[0].innerText;
    var productPrice = shopItem.getElementsByClassName('shop-item-price')[0].innerText.replace('$', '');

    // Create a cart row with product details
    var cartRow = document.createElement('div');
    cartRow.classList.add('cart-row');
    cartRow.innerHTML = `
        <span class="cart-item cart-column">${productName}</span>
        <span class="cart-price cart-column">$${productPrice}</span>
        <input class="cart-quantity cart-column" type="number" value="1" min="1">
        <button class="btn btn-danger" type="button">REMOVE</button>
    `;
    document.getElementsByClassName('cart-items')[0].append(cartRow);

    // Add event listeners for remove and quantity change actions
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity')[0].addEventListener('change', quantityChanged);

    // Update the cart total
    updateCartTotal();
    console.log(productName, productPrice);
}

function removeCartItem(event) {
    var buttonClicked = event.target;
    buttonClicked.parentElement.parentElement.remove();
    updateCartTotal();
}

function quantityChanged(event) {
    var input = event.target;
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1;
    }
    updateCartTotal();
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0];
    var cartRows = cartItemContainer.getElementsByClassName('cart-row');
    var total = 0;

    // Loop through all cart rows and calculate the total price
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i];
        var priceElement = cartRow.getElementsByClassName('cart-price')[0];
        var quantityElement = cartRow.getElementsByClassName('cart-quantity')[0];
        var price = parseFloat(priceElement.innerText.replace('$', ''));
        var quantity = quantityElement.value;
        total += price * quantity;
    }

    total = Math.round(total * 100) / 100; // Round to 2 decimal places
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total;
}

async function proceedToCheckout() {
    var cartItems = [];
    var cartRows = document.getElementsByClassName('cart-row');

    // Collect cart items
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i];
        var productName = cartRow.getElementsByClassName('cart-item')[0].innerText;
        var productPrice = cartRow.getElementsByClassName('cart-price')[0].innerText.replace('$', '');
        var quantity = cartRow.getElementsByClassName('cart-quantity')[0].value;
        cartItems.push({ productName, productPrice, quantity });
    }

    // Send the order details to the backend to create the PayPal order
    const response = await fetch('/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: cartItems
        })
    });

    const result = await response.json();
    if (result.approvalUrl) {
        // Redirect to PayPal for payment
        window.location.href = result.approvalUrl;
    } else {
        alert('Error creating PayPal order');
    }
}
