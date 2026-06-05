import express from 'express';
import { UserModel } from '../models/schemas.js';

export const debugRouter = express.Router();

debugRouter.get('/users', async (_req, res) => {
  try {
    const users = await UserModel.find({}, 'email');
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
    const user = await UserModel.findOne({ email: req.params.email });
    if (!user) {
      res.json({ exists: false });
      return;
    }
    res.json({
      exists: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
