const express = require('express');
const Todo = require('../models/todo');
const router = express.Router();

function loggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('Login required');
    }
    next();
}

router.get('/', loggedIn, async (req, res) => {
    try {
        const todos = await Todo.find({ owner: req.session.userId });
        res.json(todos);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

router.post('/', loggedIn, async (req, res) => {
    const { description } = req.body;
    const todo = new Todo({
        description,
        owner: req.session.userId
    });
    await todo.save();
    res.status(201).json(todo);
});

router.post('/toggle/:id', loggedIn, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).send('Todo not found');
        }
        todo.completed = !todo.completed;
        await todo.save();
        res.json(todo);
    } catch (error) {
        res.status(500).send('Error toggling todo');
    }
});

router.delete('/:id', loggedIn, async (req, res) => {
    try {
        const result = await Todo.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).send('Todo not found');
        }
        res.status(200).send({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).send('Error deleting todo');
    }
});

module.exports = router;


