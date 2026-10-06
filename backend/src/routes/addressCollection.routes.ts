import { Router } from 'express';
import { addAddressCollection, getAddressCollections } from '../controllers/addressCollection.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Route for fetching all address collections (typically Admin/SuperAdmin)
router.get('/', authenticate, getAddressCollections);

// Route for adding a new address collection
router.post('/', authenticate, addAddressCollection);

export default router;
