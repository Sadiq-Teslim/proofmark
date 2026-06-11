const express = require('express');
const { Recipient } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { name, email, label } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const recipient = await Recipient.create({
      userId: req.user.id, name, email: email || '', label: label || '',
    });
    res.status(201).json({ recipient });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  const recipients = await Recipient.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json({ recipients });
});

module.exports = router;
