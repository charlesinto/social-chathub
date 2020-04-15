
const {firebase, admin} = require('../database')

const db = admin.firestore();

const verifySignUpParams = async (req, res, next) => {
    try{
        const error = {}

        const {handle, email, confirmPassword, password} = req.body;
        if(handle.trim() === '')
            error.handle = 'Handle cannot be empty'

        if(email.trim() === '' || !validateEmail(email))
            error.email = 'Email is required'
        
        if(password.trim() === '')
            error.password = 'Password is required'

        if(confirmPassword !== password)
            error.password = 'Passwords do not match'

        if(Object.keys(error).length > 0)
            return res.status(400).send({message: 'Some errors were encountered', error});

        return next();
        
    }catch(error){
        console.error(error);
        return res.status(500).send({error});
    }
}

function validateEmail(email) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
}


verifyToken = async (req, res, next) => {
    try{
        const bearerHeader = req.body.token || req.headers['x-access-token'];
        if (!bearerHeader){
            return res.status(401).send({
                message: 'Unauthorized user'
            });
        }

       const decodedToken = await admin.auth().verifyIdToken(bearerHeader)
        const data = await db.collection('users').where('uid', '==', decodedToken.uid)
                                .get();
        const user = [];
        data.forEach(doc => {
            const userDoc = doc.data();
            userDoc.id = doc.id;
            user.push(userDoc);
        })
        const userHandle = user[0].id;
       req.user = decodedToken;
       req.user.handle = userHandle;
       req.user.imageUrl = user[0].imageUrl;
       return next();
    }catch(error){
        console.error(error);
        if(error.code === 'auth/id-token-expired'){
            return res.status(403).send({message:'Session expired, please login to continue'})
        }
        return res.status(403).send({error})
    }
}



module.exports = {
    verifySignUpParams,
    verifyToken
}