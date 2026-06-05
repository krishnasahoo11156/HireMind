import express from 'express';
import { userService } from '../firebase/services/userService.js';

export const debugRouter = express.Router();

debugRouter.get('/users', async (_req, res) => {
  try {
    const users = await userService.findAll();
    res.json({
      count: users.length,
      emails: users.map((u) => u.email)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

debugRouter.get('/user/:email', async (req, res) => {
  try {
    const user = await userService.findOne({ email: req.params.email });
    if (!user) {
      res.json({ exists: false });
      return;
    }
    res.json({
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
