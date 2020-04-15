const functions = require('firebase-functions');
const { firebase, admin  } = require('../database');

const db = admin.firestore();

createNotificationOnLike = functions.region('us-central1').firestore.document('likes/{id}')
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

createNotificationOnComment  = functions.region('us-central1').firestore.document('comments/{id}')
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

module.exports = {
    createNotificationOnLike,
    createNotificationOnComment
}