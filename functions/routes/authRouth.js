const express = require('express');

const router = express.Router();

const { verifySignUpParams} = require('../middleware/authMiddleware')
const {signUpUser, loginUser} = require('../controller/authController')

router.post('/login', loginUser)

router.post('/signup',verifySignUpParams, signUpUser )

module.exports = router