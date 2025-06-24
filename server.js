// Import necessary libraries and modules
const express = require('express');        // Import the Express framework
const mongoose = require('mongoose');      // Import Mongoose for MongoDB interaction
const bodyParser = require('body-parser'); // Import body-parser for parsing request bodies
const cors = require('cors');              // Import cors for handling Cross-Origin Resource Sharing
const bcrypt = require('bcrypt');          // Import bcrypt for hashing passwords
const jwt = require('jsonwebtoken');       // Import jsonwebtoken for generating and verifying tokens

const app = express();                     // Create an instance of Express
app.use(bodyParser.json());                // Use body-parser middleware to parse JSON request bodies
app.use(cors());                           // Use CORS middleware to allow cross-origin requests

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sleep-tracker-app', {
  useNewUrlParser: true,                   // Use the new URL parser
  useUnifiedTopology: true,                // Use the new topology engine
})
  .then(() => {
    console.log('Connected to MongoDB');   // Log success message on successful connection
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error); // Log error message on connection failure
  });

// Define User schema and model
const userSchema = new mongoose.Schema({
  email: String,                           // Define email field as a string
  password: String,                        // Define password field as a string
});
const User = mongoose.model('User', userSchema); // Create a User model based on the schema

// Define Sleep schema and model
const sleepSchema = new mongoose.Schema({
  date: String,                            // Define date field as a string
  hours: Number,                           // Define hours field as a number
  quality: String,                         // Define quality field as a string
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // Define userId as an ObjectId referencing the User model
    ref: 'User',
    required: true,                        // Make userId a required field
  },
});
const Sleep = mongoose.model('Sleep', sleepSchema); // Create a Sleep model based on the schema

// Middleware for authenticating JWT tokens
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Get token from Authorization header
  if (!token) return res.status(401).json({ error: 'Access denied' }); // Return 401 if no token

  jwt.verify(token, 'your_jwt_secret', (err, user) => { // Verify the token
    if (err) return res.status(403).json({ error: 'Invalid token' }); // Return 403 if token is invalid
    req.user = user;                             // Attach user info to request object
    next();                                      // Call next middleware function
  });
};

// Sign up route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;           // Get email and password from request body
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newUser = new User({ email, password: hashedPassword }); // Create new user instance
    await newUser.save();                          // Save the new user to the database
    res.status(201).json({ message: 'User signed up successfully' }); // Respond with success message
  } catch (error) {
    res.status(500).json({ error: 'Error signing up' }); // Respond with error message
  }
});

// Log in route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;           // Get email and password from request body
  try {
    const user = await User.findOne({ email });   // Find user by email
    if (!user || !await bcrypt.compare(password, user.password)) { // Check if user exists and password matches
      return res.status(401).json({ error: 'Invalid credentials' }); // Return 401 if credentials are invalid
    }
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' }); // Generate JWT token
    res.status(200).json({ token });               // Respond with the token
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' }); // Respond with error message
  }
});

// Fetch sleep data for the logged-in user
app.get('/api/sleeps/sleepdata', authenticateToken, async (req, res) => {
  try {
    const sleeps = await Sleep.find({ userId: req.user.userId }); // Find sleep data by userId
    res.json(sleeps);                        // Respond with the sleep data
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sleep data' }); // Respond with error message
  }
});

// Create new sleep data
app.post('/api/sleeps', authenticateToken, async (req, res) => {
  try {
    const sleep = new Sleep({ ...req.body, userId: req.user.userId }); // Create new sleep instance with userId
    await sleep.save();                          // Save the new sleep data to the database
    res.status(201).json({ message: 'Sleep data submitted successfully', sleep }); // Respond with success message
  } catch (error) {
    res.status(500).json({ error: 'Error submitting sleep data' }); // Respond with error message
  }
});

// Update sleep record
app.put('/api/sleeps/:id', authenticateToken, async (req, res) => {
  try {
    const updatedSleep = await Sleep.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Find and update sleep data by ID
    if (!updatedSleep) {
      return res.status(404).json({ message: 'Sleep record not found' }); // Return 404 if sleep data not found
    }
    res.json(updatedSleep);                       // Respond with the updated sleep data
  } catch (error) {
    res.status(400).json({ message: error.message }); // Respond with error message
  }
});

// Delete sleep record
app.delete('/api/sleeps/:id', authenticateToken, async (req, res) => {
  try {
    const deletedSleep = await Sleep.findByIdAndDelete(req.params.id); // Find and delete sleep data by ID
    if (!deletedSleep) {
      return res.status(404).json({ message: 'Sleep record not found' }); // Return 404 if sleep data not found
    }
    res.json({ message: 'Sleep record deleted' }); // Respond with success message
  } catch (error) {
    res.status(500).json({ message: error.message }); // Respond with error message
  }
});

// Start server
app.listen(5000, () => {
  console.log('Server is running on port 5000');  // Log message when server starts
});
