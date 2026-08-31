const validateTask = (req, res, next) => {
  const { title } = req.body;
  
  if (req.method === 'POST') {
    if (!title || title.trim().length <= 3) {
      return res.status(400).json({ error: 'Task title must be more than 3 characters' });
    }
  }

  if (req.method === 'PUT') {
    if (title !== undefined && title.trim().length <= 3) {
      return res.status(400).json({ error: 'Task title must be more than 3 characters' });
    }
  }

  next();
};

module.exports = validateTask;
