require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Todo = require('./models/todo');
// this is now a git repository

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Failed to connect to MongoDB', err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    Todo.find({ owner: req.session.userId })
        .then(todos => res.render('index', { todos }))
        .catch(err => res.status(500).send('Error fetching todos'));
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already taken');
        }
        const newUser = new User({ username, password });
        await newUser.save();
        req.session.userId = newUser._id;
        res.status(201).send('User registered successfully');
    } catch (err) {
        res.status(500).send(`Error registering user: ${err.message}`);
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            return res.status(200).send('Login successful');
        }
        res.status(400).send('Invalid credentials');
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

app.post('/todos', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    const { description } = req.body;
    const newTodo = new Todo({
        description,
        completed: false,
        owner: req.session.userId
    });
    newTodo.save()
        .then(todo => res.status(201).json(todo))
        .catch(err => res.status(400).send('Error adding todo'));
});

app.post('/todos/toggle/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    Todo.findOneAndUpdate(
        { _id: req.params.id, owner: req.session.userId },
        { completed: req.body.completed },
        { new: true }
    )
        .then(todo => {
            if (!todo) {
                return res.status(404).send('Todo not found');
            }
            res.status(200).json(todo);
        })
        .catch(err => res.status(400).send('Error toggling todo'));
});

app.delete('/todos/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized');
    }
    Todo.findOneAndDelete({ _id: req.params.id, owner: req.session.userId })
        .then(todo => {
            if (!todo) {
                return res.status(404).send('Todo not found');
            }
            res.status(200).send('Todo deleted successfully');
        })
        .catch(err => res.status(400).send('Error deleting todo'));
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});















