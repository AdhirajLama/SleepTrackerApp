// Import necessary libraries and modules
const express = require('express');        // Import the Express framework
const mongoose = require('mongoose');      // Import Mongoose for MongoDB interaction
const bodyParser = require('body-parser'); // Import body-parser for parsing request bodies
const cors = require('cors');              // Import cors for handling Cross-Origin Resource Sharing
const bcrypt = require('bcrypt');          // Import bcrypt for hashing passwords
const jwt = require('jsonwebtoken');       // Import jsonwebtoken for generating and verifying tokens
const { generateSleepAdvice } = require('./sleepAdviceEngine');

const ALLOWED_QUALITY = ['Poor', 'Average', 'Good', 'Excellent'];

function normalizeSleepDate(input) {
  if (input == null || input === '') return { error: 'Date is required' };
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return { error: 'Invalid date; use a valid calendar date' };
  return { value: d.toISOString().slice(0, 10) };
}

function parseSleepHours(v) {
  const n = typeof v === 'number' ? v : parseFloat(String(v), 10);
  if (!Number.isFinite(n) || n < 0 || n > 24) {
    return { error: 'Hours must be a number between 0 and 24' };
  }
  return { value: n };
}

function validateSleepBody(body) {
  const dateRes = normalizeSleepDate(body.date);
  if (dateRes.error) return dateRes;
  const hoursRes = parseSleepHours(body.hours);
  if (hoursRes.error) return hoursRes;
  if (!ALLOWED_QUALITY.includes(body.quality)) {
    return { error: 'Quality must be one of: Poor, Average, Good, Excellent' };
  }
  return {
    value: {
      date: dateRes.value,
      hours: hoursRes.value,
      quality: body.quality,
    },
  };
}

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

// Define User schema and model (lifestyle fields for Sleep Advice Engine per proposal)
const userSchema = new mongoose.Schema({
  email: String,                           // Define email field as a string
  password: String,                        // Define password field as a string
  age: { type: Number, min: 13, max: 120 },
  profession: {
    type: String,
    enum: ['student', 'professional', 'shift_worker', 'other'],
    default: 'other',
  },
  activityLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate',
  },
  scheduleConsistency: {
    type: String,
    enum: ['irregular', 'somewhat_consistent', 'consistent'],
    default: 'somewhat_consistent',
  },
  screenUseBeforeBed: {
    type: String,
    enum: ['often', 'sometimes', 'rarely'],
    default: 'sometimes',
  },
  caffeineLevel: {
    type: String,
    enum: ['none', 'light', 'moderate', 'heavy'],
    default: 'light',
  },
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

// Profile (for advice engine context: age, profession, activity)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      email: user.email,
      age: user.age,
      profession: user.profession,
      activityLevel: user.activityLevel,
      scheduleConsistency: user.scheduleConsistency,
      screenUseBeforeBed: user.screenUseBeforeBed,
      caffeineLevel: user.caffeineLevel,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { age, profession, activityLevel, scheduleConsistency, screenUseBeforeBed, caffeineLevel } = req.body;
  try {
    const update = {};
    if (age !== undefined) {
      const n = Number(age);
      if (!Number.isFinite(n) || n < 13 || n > 120) {
        return res.status(400).json({ error: 'Age must be between 13 and 120' });
      }
      update.age = n;
    }
    if (profession !== undefined) {
      if (!['student', 'professional', 'shift_worker', 'other'].includes(profession)) {
        return res.status(400).json({ error: 'Invalid profession' });
      }
      update.profession = profession;
    }
    if (activityLevel !== undefined) {
      if (!['low', 'moderate', 'high'].includes(activityLevel)) {
        return res.status(400).json({ error: 'Invalid activity level' });
      }
      update.activityLevel = activityLevel;
    }
    if (scheduleConsistency !== undefined) {
      if (!['irregular', 'somewhat_consistent', 'consistent'].includes(scheduleConsistency)) {
        return res.status(400).json({ error: 'Invalid schedule consistency' });
      }
      update.scheduleConsistency = scheduleConsistency;
    }
    if (screenUseBeforeBed !== undefined) {
      if (!['often', 'sometimes', 'rarely'].includes(screenUseBeforeBed)) {
        return res.status(400).json({ error: 'Invalid screen use value' });
      }
      update.screenUseBeforeBed = screenUseBeforeBed;
    }
    if (caffeineLevel !== undefined) {
      if (!['none', 'light', 'moderate', 'heavy'].includes(caffeineLevel)) {
        return res.status(400).json({ error: 'Invalid caffeine level' });
      }
      update.caffeineLevel = caffeineLevel;
    }
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      email: user.email,
      age: user.age,
      profession: user.profession,
      activityLevel: user.activityLevel,
      scheduleConsistency: user.scheduleConsistency,
      screenUseBeforeBed: user.screenUseBeforeBed,
      caffeineLevel: user.caffeineLevel,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Personalized sleep advice (profile + this user's sleep logs)
app.get('/api/advice', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const sleeps = await Sleep.find({ userId: req.user.userId });
    const payload = generateSleepAdvice(
      {
        age: user.age,
        profession: user.profession,
        activityLevel: user.activityLevel,
        scheduleConsistency: user.scheduleConsistency,
        screenUseBeforeBed: user.screenUseBeforeBed,
        caffeineLevel: user.caffeineLevel,
      },
      sleeps
    );
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Error generating advice' });
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
    const validated = validateSleepBody(req.body);
    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }
    const sleep = new Sleep({ ...validated.value, userId: req.user.userId });
    await sleep.save();
    res.status(201).json({ message: 'Sleep data submitted successfully', sleep });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting sleep data' });
  }
});

// Update sleep record (only if owned by authenticated user)
app.put('/api/sleeps/:id', authenticateToken, async (req, res) => {
  try {
    const validated = validateSleepBody(req.body);
    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }
    const updatedSleep = await Sleep.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: validated.value },
      { new: true }
    );
    if (!updatedSleep) {
      return res.status(404).json({ message: 'Sleep record not found' });
    }
    res.json(updatedSleep);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sleep record (only if owned by authenticated user)
app.delete('/api/sleeps/:id', authenticateToken, async (req, res) => {
  try {
    const deletedSleep = await Sleep.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!deletedSleep) {
      return res.status(404).json({ message: 'Sleep record not found' });
    }
    res.json({ message: 'Sleep record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(5000, () => {
  console.log('Server is running on port 5000');  // Log message when server starts
});
