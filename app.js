const express = require('express');
const fs = require('fs');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();

const PaypalSecretKey = process.env.PAYPAL_SECRET_KEY;
const PaypalClientId = process.env.PAYPAL_CLIENT_ID;

const app = express();
const environmentType = process.env.NODE_ENV || 'sandbox';
const endpoint_url = environmentType === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

function paypalEnvironment() {
    return new paypal.core.SandboxEnvironment(PaypalClientId, PaypalSecretKey);
}

function client() {
    return new paypal.core.PayPalHttpClient(paypalEnvironment());
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

app.get('/store', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end();
        } else {
            res.render('store', {
                items: JSON.parse(data),
                PaypalClientId: PaypalClientId
            });
        }
    });
});

app.post('/create-order', async (req, res) => {
    const { cart } = req.body;

    const purchase_units = cart.map(item => ({
        amount: {
            currency_code: 'USD',
            value: (item.price / 100).toFixed(2) // Convert cents to dollars
        },
        description: item.name
    }));

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: purchase_units
    });

    try {
        const order = await client().execute(request);
        const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
        res.json({ approvalUrl });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/capture-order', async (req, res) => {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await client().execute(request);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/thank-you', (req, res) => {
    res.render('thank-you');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});