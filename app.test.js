m/ moduleconst request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Todo = require('./models/todo');
require('dotenv').config();

let app;

beforeAll(async () => {
    const url = 'mongodb://127.0.0.1/todo_test';
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
        secret: 'testsecret',
        resave: false,
        saveUninitialized: true,
    }));
    app.use((req, res, next) => {
        req.session.userId = 'testUserId'; // Mock session user ID
        next();
    });
    app.use('/', require('./app'));  // Assuming your routes are in app.js
});

describe('GET /register', () => {
    it('should return the register page', async () => {
        const res = await request(app).get('/register');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Register');
    });
});

describe('POST /register', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.text).toContain('User registered successfully');
    });

    it('should not register a user with an existing username', async () => {
        await User.create({ username: 'existinguser', password: 'password' });
        const res = await request(app)
            .post('/register')
            .send({
                username: 'existinguser',
                password: 'password'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.text).toContain('Username already taken');
    });
});

describe('POST /login', () => {
    it('should login a user with correct credentials', async () => {
        const password = await bcrypt.hash('testpassword', 10);
        await User.create({ username: 'testuser', password });
        const res = await request(app)
            .post('/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Login successful');
    });

    it('should not login a user with incorrect credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                username: 'nonexistentuser',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.text).toContain('Invalid credentials');
    });
});

describe('POST /todos', () => {
    it('should create a new todo', async () => {
        const user = await User.create({ username: 'testuser', password: 'testpassword' });
        const res = await request(app)
            .post('/todos')
            .send({
                description: 'Test todo'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.description).toEqual('Test todo');
        expect(res.body.owner).toEqual(user._id.toString());
    });
});

// More tests for other routes like /todos/toggle/:id, /todos/:id, etc.



