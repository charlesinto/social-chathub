const express = require('express');

const {verifyToken} = require('../middleware/authMiddleware')

const {uploadImage, getUserProfile, updateProfile, getNotifications,
        getMyProfile, markNotificationAsRead, markMultipleNotificationAsRead} = require('../controller/userController')

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() })

const router = express.Router();


router.post('/image/upload',verifyToken, uploadImage);

router.post('/profile/updage', verifyToken, updateProfile)

router.get('/profile/:user',verifyToken, getUserProfile);

router.get('/profile', verifyToken, getMyProfile);

router.get('/notifications', verifyToken, getNotifications)

router.get('/notification/:notificationId/mark-read', verifyToken, markNotificationAsRead )

router.post('/notifications/mark-read', verifyToken, markMultipleNotificationAsRead)


module.exports = router;