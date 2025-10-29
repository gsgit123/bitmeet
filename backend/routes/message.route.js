import express from 'express';
import { getMessages, postMessage } from '../controllers/message.controller.js';

const router=express.Router();

router.get('/:roomId',getMessages);

router.post('/',postMessage);

export default router;

