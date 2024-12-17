const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // Import express-session
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const logoutRoute = require('./routes/logoutRoute');
const inventoryRoutes = require('./routes/inventoryRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const searchRoutes = require('./routes/searchRoutes');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public/uploads', express.static('public/uploads'));
app.use('/styles', express.static('public/styles'));
app.use('/images', express.static('public/images'));
app.use(express.static('public'));
app.use(cors());


// Set up session middleware
app.use(
    session({
        secret: 'your-secret-key', // Use a secure secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set `secure: true` if using HTTPS
    })
);

// Fixing conflicting route registration order
app.use('/', logoutRoute); // Register logout route FIRST
app.use('/auth', authRoutes);
app.use('/', authRoutes);
app.use('/', searchRoutes);
app.use(orderRoutes);
app.use(inventoryRoutes);
app.use('/', deliveryRoutes); // Register deliveryRoutes AFTER logoutRoute
app.use('/deliveries', deliveryRoutes);
app.use(dashboardRoutes);

// Root route
app.get('/', (req, res) => {
    res.render('index'); // Render the 'views/index.ejs' file
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
