const Task = require('../models/task');

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new task
exports.addTask = async (req, res) => {
  const { id, title, description, createdDate, dueDate, priority, status, tags } = req.body;
  if (!id || !title || !createdDate) {
    return res.status(400).json({ message: 'ID, title, and createdDate are required' });
  }

  try {
    const existingTask = await Task.findById(id);
    if (existingTask) {
      return res.status(400).json({ message: 'Task with this ID already exists' });
    }

    const task = new Task({
      _id: id,
      title,
      description: description || '',
      createdDate: new Date(createdDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      status: status || 'todo',
      tags: tags || [],
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, createdDate, dueDate, priority, status, tags } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.createdDate = createdDate ? new Date(createdDate) : task.createdDate;
    task.dueDate = dueDate !== undefined ? new Date(dueDate) : task.dueDate;
    task.priority = priority !== undefined ? priority : task.priority;
    task.status = status !== undefined ? status : task.status;
    task.tags = tags !== undefined ? tags : task.tags;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Task.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sync tasks
exports.syncTasks = async (req, res) => {
  const tasksFromClient = req.body;

  if (!Array.isArray(tasksFromClient)) {
    return res.status(400).json({ message: 'Request body must be an array of tasks' });
  }

  try {
    const serverTasks = await Task.find({});
    const serverTaskIds = serverTasks.map(t => t._id.toString());
    const clientTaskIds = tasksFromClient.map(t => t.id);

    // Delete tasks not in client list
    const tasksToDelete = serverTaskIds.filter(id => !clientTaskIds.includes(id));
    if (tasksToDelete.length > 0) {
      await Task.deleteMany({ _id: { $in: tasksToDelete } });
    }

    // Upsert client tasks
    for (const taskData of tasksFromClient) {
      const { id, title, description, createdDate, dueDate, priority, status, tags } = taskData;
      if (!id || !title || !createdDate) continue;

      await Task.findOneAndUpdate(
        { _id: id },
        {
          title,
          description: description || '',
          createdDate: new Date(createdDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || 'medium',
          status: status || 'todo',
          tags: tags || [],
        },
        { upsert: true, new: true }
      );
    }

    // Return all tasks after sync
    const updatedTasks = await Task.find({});
    res.json(updatedTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};