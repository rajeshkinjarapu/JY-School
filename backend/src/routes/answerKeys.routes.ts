import { Router } from 'express';
import { saveAnswerKey, getAnswerKey } from '../controllers/answerKeys.controller';

const router = Router();

router.post('/', saveAnswerKey);
router.get('/:paperId', getAnswerKey);

export default router;
