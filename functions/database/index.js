const { config} = require('../config')
const serviceAccount = require('../serviceAccount.json');

const admin = require('firebase-admin');
const firebase = require('firebase');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-chathub.firebaseio.com"
});



firebase.initializeApp(config);

module.exports = {
    firebase,
    admin
}
