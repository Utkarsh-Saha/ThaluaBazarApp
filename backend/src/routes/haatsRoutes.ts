import { Router } from 'express';
import { getHaats, getHaatById } from '../controllers/haatsController.js';

const router = Router();

router.get('/', getHaats);
router.get('/:id', getHaatById);

export default router;
