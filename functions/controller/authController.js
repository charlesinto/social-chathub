const {firebase, admin} = require('../database')

const db = admin.firestore();

const signUpUser = (req, res) => {
    const {handle, email, password} = req.body;
    let userToken;
    let userId;
    return db.doc(`/users/${handle}`).get()
        .then(doc => {
            if(doc.exists){
                return res.status(400).send({handle:'Handle already exists'});
            }
            return firebase.auth()
                    .createUserWithEmailAndPassword(email, password)
                    
        })
        .then(data => {
            userId = data.user.uid
            return data.user.getIdToken(true)
        })
        .then(token => {
            userToken = token;
            return db.collection('users').doc(handle).set({handle, email, 
                    password,
                    uid: userId,
                    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/social-chathub.appspot.com/o/blank-profile-picture-973460_640.png?alt=media',
                    createdAt: new Date().toLocaleDateString()
                });
        })
        .then(() => {
            return res.status(201).send({message: 'User created successfully', token: userToken});
        })
        .catch((err) => {
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).send({message:'Email is already in use'});
            }
            if(err.code === 'auth/weak-password'){
                return res.status(400).send({message:'Weak Password'});
            }
            if(err.code === 'auth/invalid-email'){
                return res.status(400).send({message:'Invalid Email'});
            }
            console.error(err.code);
            return res.status(500).send(err)
        })   
}

const loginUser = async (req, res) => {
    try{
        const {email, password} = req.body;
        const data = await firebase.auth().signInWithEmailAndPassword(email, password)
        const token = await data.user.getIdToken(true);
        const userDoc = await db.collection('users').where('email','==', email).get();
        const user = [];
        userDoc.forEach(doc => user.push({handle: doc.id, email: doc.data().email, uid: doc.data().uid }))
        const notificationDoc = await db.collection('notifications').where('recipient','==', user[0].handle )
                                    .where('read', '==', false).orderBy('createdAt', 'desc').get();
        const notifications = [];
        notificationDoc.forEach(doc => {
            const document = doc.data()
            document.id = doc.id;
            notifications.push(document);
        })
        return res.status(200).send({
            message: `Operation Successful`,
            user: user[0],
            token,
            notifications
        })
    }catch(error){
        if(error.code === 'auth/email-already-in-use'){
            return res.status(400).send({message:'Email is already in use'});
        }
        if(error.code === 'auth/weak-password'){
            return res.status(400).send({message:'Weak Password'});
        }
        if(error.code === 'auth/invalid-email'){
            return res.status(400).send({message:'Invalid Email'});
        }
        console.error(error);
        return res.status(500).send({error})
    }
}

module.exports = {
    signUpUser,
    loginUser
}
