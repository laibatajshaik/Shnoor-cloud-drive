const express = require('express');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.post('/upload-batch', upload.array('files', 500), fileController.uploadBatch);
router.patch('/:id/rename', fileController.renameFile);
router.patch('/:id/move', fileController.moveFile);
router.delete('/:id', fileController.deleteFile);
router.get('/:id/download', fileController.getDownloadUrl);

module.exports = router;
