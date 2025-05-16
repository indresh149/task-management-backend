const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Client-provided UUID
  title: { type: String, required: true },
  description: { type: String, default: '' },
  createdDate: { type: Date, required: true },
  dueDate: { type: Date },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['todo', 'inProgress', 'done'], 
    default: 'todo' 
  },
  tags: { type: [String], default: [] },
}, { _id: false });

module.exports = mongoose.model('Task', taskSchema);