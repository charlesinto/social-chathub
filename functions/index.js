
const functions = require('firebase-functions');
const {firebase, admin} = require('./database')
const express = require('express');

const bodyParser = require('body-parser');
const Busboy = require('busboy');
const connectBusboy = require('connect-busboy');
const fileParser = require('express-multipart-file-parser')

const { createNotificationOnLike, createNotificationOnComment } = require('./notifications')

const db = admin.firestore();

const app = express();

app.use(connectBusboy())

app.use(fileParser)

 //app.use(bodyParser.urlencoded({extended: true}));
 app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));



const authRoute = require('./routes/authRouth')

const screamRoute = require('./routes/screamRoute')

const userRoute = require('./routes/userRoute');


app.use('/v1/scream', screamRoute);

app.use('/v1/auth', authRoute);

app.use('/v1/user/auth', userRoute);




// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.createLikeNotification = functions.region('us-central1').firestore.document('likes/{id}')
                                    .onCreate(async (snapshot) => {
                                        try{
                                            const doc = await db.doc(`/screams/${snapshot.data().screamId}`).get()
                                            if(!doc.exists) 
                                                return ;
                                            await db.doc(`/notifications/${snapshot.id}`).set({
                                                type: 'like',
                                                sender: snapshot.data().handle,
                                                recipient: doc.data().handle,
                                                createdAt: new Date(),
                                                screamId: snapshot.data().screamId,
                                                read: false
                                            })
                                        }catch(error){
                                            console.error(error);
                                            return;
                                        }

                                    });

exports.createOnCommentNotification = functions.region('us-central1').firestore.document('comments/{id}')
                                        .onCreate(async(snapshot) => {
                                            try{
                                                const doc = await db.doc(`/screams/${snapshot.data().screamId}`).get()
                                                if(!doc.exists)
                                                    return ;
                                                db.doc(`/notifications/${snapshot.id}`).set({
                                                    type: 'comment',
                                                    sender: snapshot.data().handle,
                                                    recipient: doc.data().handle,
                                                    createdAt: new Date(),
                                                    screamId: snapshot.data().screamId,
                                                    read: false
                                                })
                                            }catch(error){
                                                console.error(error);
                                                return ;
                                            }
                                        })

exports.deleteNotificationOnUnlike = functions.region('us-central1').firestore.document('likes/{id}')
                                            .onDelete( async (snapshot) => {
                                                try{
                                                    const doc = await db.doc(`/screams/${snapshot.data().screamId}`).get()
                                                    if(!doc.exists)
                                                        return ;
                                                    await db.doc(`/notifications/${snapshot.id}`).delete()
                                                }catch(error){
                                                    console.error(error);
                                                    return ;
                                                }
                                            })

exports.onImageChangeNotifaction = functions.region('us-central1').firestore.document('users/{userId}')
                                        .onUpdate(async (change) => {
                                            if(change.after.data().imageUrl !== change.before.data().imageUrl){
                                                try{
                                                    
                                                    const batch = db.batch();
                                                    const docs = await db.collection('screams').where('handle', '==', change.after.data().handle).get()

                                                    docs.forEach( doc => {
                                                        const screams = db.doc(`/screams/${doc.id}`);
                                                        batch.update(screams, {userImage: change.after.data().imageUrl})
                                                    })

                                                    await batch.commit()
                                                } catch(error){
                                                    console.error(error)
                                                }
                                            }
                                        })

exports.onNotficationOnScreamDelete = functions.region('us-central1').firestore.document('screams/{id}')
                                        .onDelete( async (snapshot, context) => {
                                            try{
                                                const screamId = context.params.id
                                                const batch = db.batch();
                                                const likeDocs = await db.collection('likes').where('screamId', '==', screamId).get()
                                                likeDocs.forEach(doc => {
                                                    const likes = db.doc(`/likes/${doc.id}`)
                                                    batch.delete(likes)
                                                })

                                                const commentDocs = await db.collection('comments').where('screamId', '==', screamId).get()
                                                commentDocs.forEach(doc => {
                                                    const comment = db.doc(`/comments/${doc.id}`)
                                                    batch.delete(comment)
                                                })

                                                const notificationDocs = await db.collection('notifications').where('screamId', '==', screamId).get()
                                                notificationDocs.forEach(doc => {
                                                    const notification = db.doc(`/notifications/${doc.id}`)
                                                    batch.delete(notification)
                                                })

                                                await batch.commit()
                                            }catch(error){
                                                console.error(error);
                                                return ;
                                            }
                                        })

exports.api = functions.https.onRequest(app);

