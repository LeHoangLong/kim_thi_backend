"use strict";
let cart = {};
$('.nav-link').each(function () {
    let currentUrl = window.location.href;
    if (currentUrl.includes($(this).attr('href'))) {
        $(this).addClass('selected');
    }
    else {
        $(this).removeClass('selected');
    }
});
$('#show-menu-button').click(function () {
    $('#nav-board').toggleClass('nav-board-display');
    $('#nav-board').toggleClass('nav-board-hidden');
});
var addToCartButtonClicked = false;
$('#add-to-cart-button').click(function () {
    $('#quantity-and-unit-selection').removeClass('quantity-and-unit-selection-hidden');
    addToCartButtonClicked = true;
});
$('#buy-now-button').click(function () {
    $('#quantity-and-unit-selection').removeClass('quantity-and-unit-selection-hidden');
    addToCartButtonClicked = false;
});
$('#quantity-and-unit-selection .background').click(function () {
    $('#quantity-and-unit-selection').addClass('quantity-and-unit-selection-hidden');
});
$('#confirm-buy-button').click(function () {
    if (addToCartButtonClicked) {
        let unit = $('#unit-select').val();
        let productCount = parseInt($('#quantity-input').val());
        if (!isNaN(productCount)) {
            let itemName = context.productDetail.product.id + '__' + unit;
            if (cart[itemName] === undefined) {
                cart[itemName] = {
                    detail: context.productDetail,
                    count: productCount,
                    isSelected: true,
                };
            }
            else {
                cart[itemName].count += productCount;
            }
            cartUpdated();
            $('#quantity-and-unit-selection').addClass('quantity-and-unit-selection-hidden');
        }
    }
    else {
    }
});
$('#floating-cart-button').click(function () {
    $('#cart-page').css('display', 'block');
    $('#product-detail-page').css('display', 'none');
    displayCart();
});
$('#cart-page .go-back-button').click(function () {
    $('#cart-page').css('display', 'none');
    $('#product-detail-page').css('display', 'block');
});
$(function () {
    let cartStr = localStorage.getItem('cart');
    if (cartStr) {
        cart = JSON.parse(cartStr);
    }
});
setInterval(function () {
    $('#cart-number-of-items').text(Object.keys(cart).length);
}, 100);
function findPriceAndQuantity(detail, quantity, unit) {
    let price = 0;
    let minQuantity = 0;
    for (let i = 0; i < detail.prices.length; i++) {
        if (detail.prices[i].unit === unit) {
            price = detail.prices[i].defaultPrice;
            for (let j = 0; j < detail.prices[i].priceLevels.length; j++) {
                if (detail.prices[i].priceLevels[j].minQuantity < quantity) {
                    price = detail.prices[i].priceLevels[j].price;
                    minQuantity = detail.prices[i].priceLevels[j].minQuantity;
                }
            }
        }
    }
    return [price, minQuantity];
}
function displayPriceAndQuantity(cartItem, detail, quantity, unit) {
    let [price, minQuantity] = findPriceAndQuantity(detail, quantity, unit);
    cartItem.find('.cart-item-price').text(price.toLocaleString() + ' đ');
    if (minQuantity > 0) {
        cartItem.find('.cart-item-min-quantity').text(`/ ${minQuantity} ${unit}`);
    }
    cartItem.find('.cart-item-quantity').val(quantity.toLocaleString());
}
function cartUpdated() {
    localStorage.setItem('cart', JSON.stringify(cart));
    for (let key in cart) {
        let detail = cart[key].detail;
        let unit = key.split('__')[1];
        displayPriceAndQuantity($(`#cart-item-${key}`), detail, cart[key].count, unit);
    }
    cartSelectedItemsChanged();
    displayCartTotal();
}
function cartSelectedItemsChanged() {
    let selectedItemFound = false;
    for (let key in cart) {
        if (cart[key].isSelected) {
            selectedItemFound = true;
            break;
        }
    }
    if (selectedItemFound) {
        $('#remove-cart-item-button').css('display', 'block');
    }
    else {
        $('#remove-cart-item-button').css('display', 'none');
    }
}
function displayCart() {
    $('#cart-item-list').empty();
    for (let key in cart) {
        let detail = cart[key].detail;
        let unit = key.split('__')[1];
        let cloned = $('#cart-item-template').clone();
        cloned.css('display', '');
        cloned.attr('id', `cart-item-${key}`);
        cloned.find('.cart-item-product-name').text(detail.product.name);
        cloned.find('.cart-item-avatar-link').attr('href', `/products/${detail.product.id}`);
        cloned.find('.cart-item-avatar').attr('src', '/' + detail.avatar.path);
        cloned.find('.cart-item-unit').text(unit);
        cloned.find('.car-item-select').prop('checked', cart[key].isSelected);
        cloned.find('.car-item-select').click(function () {
            cart[key].isSelected = !cart[key].isSelected;
            $(this).prop('checked', cart[key].isSelected);
            cartUpdated();
        });
        let quantity = cart[key].count;
        displayPriceAndQuantity(cloned, detail, quantity, unit);
        cloned.find('.cart-item-quantity').change(function (event) {
            let count = parseInt(event.target.value);
            if (!isNaN(count)) {
                cart[key].count = count;
                cartUpdated();
            }
            else {
                count = parseFloat(event.target.value);
                if (!isNaN(count)) {
                    cart[key].count = count;
                    cartUpdated();
                }
            }
        });
        cloned.appendTo('#cart-item-list');
    }
    cartSelectedItemsChanged();
    displayCartTotal();
}
$('#remove-cart-item-button').click(function () {
    for (let key in cart) {
        if (cart[key].isSelected) {
            delete cart[key];
        }
    }
    displayCart();
});
function displayCartTotal() {
    console.log('display cart total');
    let total = 0;
    for (let key in cart) {
        let unit = key.split('__')[1];
        let detail = cart[key].detail;
        let quantity = cart[key].count;
        let [price, minQuantity] = findPriceAndQuantity(detail, quantity, unit);
        total += price * quantity;
    }
    $('#total').text(total.toLocaleString() + ' đ');
}
