
const path = require('path')

const os = require('os');

const fs = require('fs');

const { config: {storageBucket}} = require('../config')

const {admin, firebase} = require('../database')

const db = admin.firestore();

const uploadImage = async (req, res) => {
    try{
        if(!req.files)
            return res.status(400).send({message:'No files selected'});
        const { mimetype } = req.files[0]

        const file = req.files[0];
        const fileToUpload = {};

        if(mimetype !== 'image/png' && mimetype !== 'image/jpg' && mimetype !== 'image/jpeg')
              return res.status(400).send({message: 'Only png, jpg and jpeg file types is supported'});
        fileToUpload.imageName = getFileName(file);
        fileToUpload.extension = getFileExtension(file);
        fileToUpload.path = path.join(os.tmpdir(), fileToUpload.imageName);
        fileToUpload.mimetype = mimetype;
        fs.writeFileSync(fileToUpload.path, file.buffer);

        await admin.storage().bucket().upload(fileToUpload.path, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: fileToUpload.mimetype
                }
            }
        })
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${fileToUpload.imageName}?alt=media`
            await db.doc(`/users/${req.user.handle}`).update({
                imageUrl
            })
            return res.status(200).send({message: 'Image uploaded successfully', imageUrl});
      
    }catch(error){
        return res.status(500).send({error})
    }
}

const getFileName =  (file) => {
    let fieldname = file.fieldname + "-" + Math.random().toString(36).substring(7)+ Date.now() + "." + file.mimetype.split("/")[1];
    return fieldname;
}

const getFileExtension = ({mimetype}) => {
    let extension = mimetype.split('/')[1]
    return extension;
}

const updateProfile = async (req, res) => {
    try{
        const {bio, website, location} = req.body;
        if(!(bio && bio.trim() !== '') || (website && website.trim() !== ''))
            return res.status(400).send({message: 'Bad Request'});
        await db.doc(`/users/${req.user.handle}`).update({bio, website, location});
        return res.status(200).send({message: 'Profile Updated Successfully'})
    } catch(error){
        console.error(error)
        return res.status(500).send({error})
    }
}

const getUserProfile = async (req, res) => {
    try{
        const user = req.params.user;
        if(!user)
            return res.status(400).send({message: 'Bad Request'});
        const doc = await db.doc(`/users/${user}`).get()
        if(!doc.exists)
            return res.status(404).send({message: 'User not found'})
        const userDetail = {
            email: doc.data().email,
            handle: doc.data().handle,
            bio: doc.data().bio,
            website: doc.data().website,
            imageUrl: doc.data().imageUrl
        }
        return res.status(200).send({message: 'Success', user: userDetail})
    } catch(error){
        console.error(error)
        return res.status(500).send({error})
    }
}

const getMyProfile = async (req, res ) => {
    try{
        const doc = await db.doc(`/users/${req.user.handle}`).get()
        if(!doc.exists)
            return res.status(404).send({message: 'User not found'})
        const userDetail = {
            email: doc.data().email,
            handle: doc.data().handle,
            bio: doc.data().bio,
            website: doc.data().website,
            imageUrl: doc.data().imageUrl
        }
        const likesDocs = await db.collection('likes').where('handle', '==', req.user.handle).get()
        const likes = [];
        likesDocs.forEach(doc => {
            likeData = doc.data()
            likeData.id = doc.data;
            likes.push(likeData);
        });
        userDetail.likes = likes;

        const commentDocs = await db.collection('comments').where('handle', '==', req.user.handle).get();
        const comments = [];

        commentDocs.forEach(comment => {
            const document = comment.data();
            document.id = comment.id;
            comments.push(document)
        })
        userDetail.comments = comments;

        const notificationDoc = await db.collection('notifications').where('recipient','==', req.user.handle)
                                        .orderBy('createdAt', 'desc').get();
        const notifications = [];
        notificationDoc.forEach(doc => {
            const document = doc.data()
            document.id = doc.id;
            notifications.push(document);
        })

        userDetail.notifications = notifications;

        return res.status(200).send({message: 'Success', user: userDetail})
    } catch(error){
        console.error(error)
        return res.status(500).send({error})
    }
}

const getNotifications = async (req, res ) => {
    try{
        const notificationDoc = await db.collection('notifications').where('recipient','==', req.user.handle )
                                   .orderBy('createdAt', 'desc').get();
        const notifications = [];
        notificationDoc.forEach(doc => {
            const document = doc.data()
            document.id = doc.id;
            notifications.push(document);
        })
        return res.status(200).send({
            message: `Operation Successful`,
            notifications
        })
    }catch(error){
        console.error(error);
        return res.status(500).send({ error })
    }
}

const markNotificationAsRead = async (req, res) => {
    try{
        const notificationId = req.params.notificationId;
        if(!notificationId)
            return res.status(404).send({message: 'Notification not found'})
        
        await db.doc(`/notifications/${notificationId}`).update({
            read: true
        })
        return res.status(200).send({ message: 'Operation successful'});
    }catch(error){
        console.error(error);
        return res.status(500).send({ error })
    
    }
}

const markMultipleNotificationAsRead = async ( req, res ) => {
    try{
        const batch = db.batch()

        req.body.forEach(id => {
            const notification = db.doc(`/notifications/${id}`)

            batch.update(notification, {read: true})
        })
        await batch.commit();

        return res.status(200).send({ message: 'Notifications marked as read'})
    }catch(error){
        console.error(error);
        return res.status(500).send({error})
    }
}

module.exports = {
    uploadImage,
    getUserProfile,
    updateProfile,
    getMyProfile,
    getNotifications,
    markNotificationAsRead,
    markMultipleNotificationAsRead
}