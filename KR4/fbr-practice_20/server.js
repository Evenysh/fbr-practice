const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/fbr_practice_20')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Connection error:', err));

  //схема пользователя
const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  created_at: {
    type: Number,
    required: true
  },
  updated_at: {
    type: Number,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.json({ message: 'MongoDB API is running' });
});

// создание нового пользователя
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;

    if (!first_name || !last_name || age === undefined) {
      return res.status(400).json({ error: 'first_name, last_name and age are required' });
    }

    const lastUser = await User.findOne().sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 : 1;

    const now = Date.now();

    //экземпляр модели User
    const user = new User({
      id: newId,
      first_name,
      last_name,
      age,
      created_at: now,
      updated_at: now
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// озвращает всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ id: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ищет одного пользователя по числовому id
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// делает частичное обновление пользователя
app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.body.first_name !== undefined) {
      user.first_name = req.body.first_name;
    }

    if (req.body.last_name !== undefined) {
      user.last_name = req.body.last_name;
    }

    if (req.body.age !== undefined) {
      user.age = req.body.age;
    }

    user.updated_at = Date.now();

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// удаляет пользователя
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: Number(req.params.id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});