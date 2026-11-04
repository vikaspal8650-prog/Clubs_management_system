const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const { listCertificates, createBatch, updateCertificate } = require('../controllers/certificate.controller');
const router = express.Router();
router.use(authenticate);
router.get('/', listCertificates);
router.post('/batches', createBatch);
router.patch('/:id', updateCertificate);
module.exports = router;
