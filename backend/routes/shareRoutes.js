const express = require('express');
const shareController = require('../controllers/shareController');
const { protect, optionalAuth } = require('../middleware/auth');
const { shareLinkLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', protect, shareController.createShareLink);
router.get('/mine', protect, shareController.listMyShareLinks);
router.delete('/:token', protect, shareController.revokeShareLink);

router.get('/:token', shareLinkLimiter, optionalAuth, shareController.resolveShareLink);

module.exports = router;
