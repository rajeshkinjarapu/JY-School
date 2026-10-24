import { Router } from 'express';
import { 
  addAddressCollection, 
  getAddressCollections, 
  deleteAddressCollection,
  updateAddressCollection,
  bulkAddAddressCollection 
} from '../controllers/addressCollection.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Route for fetching all address collections (typically Admin/SuperAdmin)
router.get('/', authenticate, getAddressCollections);

// Route for adding a new address collection
router.post('/', authenticate, addAddressCollection);

// Route for bulk importing address collections from Excel
router.post('/bulk', authenticate, bulkAddAddressCollection);

// Route for updating an address collection entry
router.put('/:id', authenticate, updateAddressCollection);

// Route for deleting an address collection entry
router.delete('/:id', authenticate, deleteAddressCollection);

export default router;

