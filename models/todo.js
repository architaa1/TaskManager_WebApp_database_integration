const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    description: { type: String, required: true },
    completed: { type: Boolean, required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;


