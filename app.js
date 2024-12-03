require('dotenv').config();

const express = require('express');
const app = express();
const paypal = require('./Services/paypal');

app.use(express.static('public'));
app.use(express.json()); // Add this line to parse JSON request bodies

app.set('view engine', 'ejs');

// Define routes for different pages
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/about.ejs', (req, res) => {
  res.render('about');
});

app.get('/store', (req, res) => {
  res.render('store');
});

// Route to handle PayPal order creation
app.post('/create-order', async (req, res) => {
  const { items } = req.body;

  // Ensure items is an array
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid items format' });
  }

  try {
    const order = await paypal.createOrder(items); // Pass the items to the createOrder function
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Error creating order');
  }
});

app.get('/complete-order', (req, res) => {
  res.render('complete-order');
});

// Helper function to calculate the total amount from the cart items
function calculateTotalAmount(items) {
  return items.reduce((total, item) => total + parseFloat(item.productPrice), 0).toFixed(2);
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
