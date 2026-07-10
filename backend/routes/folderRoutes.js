const express = require('express');
const folderController = require('../controllers/folderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', folderController.listChildren);
router.get('/search', folderController.searchFiles);
router.post('/', folderController.createFolder);
router.patch('/:id/rename', folderController.renameFolder);
router.patch('/:id/move', folderController.moveFolder);
router.delete('/:id', folderController.deleteFolder);

module.exports = router;
