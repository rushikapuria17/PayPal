const axios = require('axios');
require('dotenv').config();

async function createOrder(cartItems) {
    const accessToken = await generateAccessToken();

    const purchaseUnits = [{
        reference_id: 'default', // A unique reference ID
        amount: {
            currency_code: 'USD',
            value: '0.00', // Initialize value to 0.00 as a valid number
            breakdown: {
                item_total: {
                    currency_code: 'USD',
                    value: '0.00' // Initialize item_total with a valid number
                },
                shipping: {
                    currency_code: 'USD',
                    value: '0.00' // Ensure valid shipping value if applicable
                }
            }
        },
        items: []
    }];

    // Add items to purchase units and calculate totals
    cartItems.forEach(item => {
        const itemPrice = parseFloat(item.productPrice);
        const quantity = item.quantity || 1; // Default to 1 if quantity is not provided
        
        // Check if the itemPrice is a valid number
        if (isNaN(itemPrice)) {
            return;
        }

        // Add the item to the purchase unit
        purchaseUnits[0].items.push({
            name: item.productName,
            unit_amount: {
                currency_code: 'USD',
                value: itemPrice.toFixed(2) // Ensure the value is properly formatted
            },
            quantity: quantity.toString() // Ensure quantity is a string
        });

        // Update the totals, making sure the values are valid
        purchaseUnits[0].amount.value = (parseFloat(purchaseUnits[0].amount.value) + (itemPrice * quantity)).toFixed(2);
        purchaseUnits[0].amount.breakdown.item_total.value = (parseFloat(purchaseUnits[0].amount.breakdown.item_total.value) + (itemPrice * quantity)).toFixed(2);
    });

    // Make the request to create the PayPal order
    const response = await axios({
        url: `${process.env.PAYPAL_BASEURL}/v2/checkout/orders`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        data: {
            intent: 'CAPTURE',
            purchase_units: purchaseUnits,
            application_context: {
                brand_name: 'Your Store',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.BASEURL}/complete-order`,
                cancel_url: `${process.env.BASEURL}/cancel`
            }
        }
    });

    // Find and return the approval URL for the PayPal order
    const approvalUrl = response.data.links.find(link => link.rel === 'approve').href;
    return { approvalUrl };
}

async function generateAccessToken() {
    const response = await axios({
        url: `${process.env.PAYPAL_BASEURL}/v1/oauth2/token`,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: process.env.CLIENT_ID,
            password: process.env.SECRET_ID
        },
        data: 'grant_type=client_credentials'
    });

    return response.data.access_token;
}

module.exports = { createOrder };
