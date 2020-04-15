const express = require('express');

const {verifyToken} = require('../middleware/authMiddleware')

const router = express.Router();

const {createScream, getScream, getScreamById,deleteAScream, 
        commentOnScream, likeAScream, unlikeAScream} = require('../controller/screamController')


router.post('/create-scream',verifyToken, createScream)

router.get('/',  getScream)

router.get('/:id', getScreamById)

router.post('/:screamId/comment', verifyToken, commentOnScream);

router.get('/:screamId/like', verifyToken, likeAScream);

router.get('/:screamId/unlike', verifyToken, unlikeAScream)

router.delete('/:screamId/delete', verifyToken, deleteAScream);

module.exports = router

