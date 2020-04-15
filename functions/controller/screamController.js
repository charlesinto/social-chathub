const {firebase, admin} = require('../database')

const db = admin.firestore();


const createScream = (req,res) => {
    const {body} = req.body;
    const newScream = {
        body,
        userImage: req.user.imageUrl,
        handle: req.user.handle,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date()
    }
    db.collection('screams').add(newScream)
        .then(doc => {
            newScream.id = doc.id;
            return res.status(201).send({message: 'document created successfully', scream: newScream});
        })
        .catch(error => {
            console.error(error);
            return res.status(500).send({error});
        })
}

const getScream = (req, res) => {
    db.collection('screams').orderBy('createdAt', 'desc')
        .get().then(doc => {
                const screams = [];
                 doc.forEach(doc => {
                    const {createdAt, body, userHandle} = doc.data();
                    screams.push({
                        id: doc.id,
                        createdAt,
                        body,
                        createdBy: userHandle
                    })
                })
                return res.status(200).send({screams})
            })
            .catch(error => {
                console.error(error);
                return res.status(500).send({error})
            })
}

const getScreamById = async (req, res) => {
    try{
        const screamId = req.params.id;
        const screamDoc = await db.doc(`/screams/${screamId}`).get();
        if(!screamDoc.exists)
            return res.status(404).send({message: 'scream not found'})
        const screamData = screamDoc.data();
        screamData.id = screamDoc.id;

        const likesDoc = await db.collection('likes').where('screamId', '==', screamId)
                    .orderBy('createdAt','desc').get();

        const likes = []
        likesDoc.forEach(doc => {
            const docment = doc.data();
            docment.id = doc.id;
            likes.push(docment)
        })
        screamData.likes = likes;

        const commentDocs = await db.collection('comments').where('screamId', '==', screamId)
            .orderBy('createdAt', 'desc').get();

        const comments = [];

        commentDocs.forEach(comment => {
            const docment = comment.data();
            docment.id = comment.id;
            comments.push(docment);
        })
        screamData.comments = comments;
        return res.status(200).send({message:'success', screams: screamData})
    }catch(error){
        console.error(error);
        return res.status(500).send({ error })
    }
}

const commentOnScream = async ( req, res ) => {
    try{
        const {comment} = req.body;
        const screamId = req.params.screamId;
        if(!screamId || !(comment && comment.trim() !== ''))
            return res.status(400).send({message:'Bad Request'})
        const screamDoc = await db.doc(`/screams/${screamId}`).get();
        if(!screamDoc.exists)
            return res.status(404).send({message: 'Scream not found'})
        

        await db.collection('comments').add({
            screamId,
            comment,
            handle: req.user.handle,
            avatarUrl: req.user.imageUrl,
            createdAt: new Date()
        })
        const scream = await db.doc(`/screams/${screamId}`).get();

        await db.doc(`/screams/${screamId}`).update({
            commentCount: scream.data().commentCount + 1
        });
        return res.status(200).send({message: 'Comment posted successfully'})
    }catch(error){
        console.error(error);
        return res.status(500).send({error});
    }

}

const likeAScream = async (req, res) => {
    try{
        const screamId = req.params.screamId;
        if(!screamId)
            return res.status(400).send({message: 'Bad request'});
        const doc = await db.doc(`/screams/${screamId}`).get();
        if(!doc.exists)
            return res.status(404).send({message: 'Scream not found'});
        // check if doc is already liked
        const likeDoc = await db.collection('likes').where('screamId','==', screamId)
                .where('handle','==', req.user.handle).get();
        if(!likeDoc.empty)
            return res.status(200).send({message: 'success, document already liked'})
        
        await db.collection('likes').add({
            screamId,
            handle: req.user.handle,
            createdAt: new Date()
        })
        const scream = await db.doc(`/screams/${screamId}`).get();

        await db.doc(`/screams/${screamId}`).update({
            likeCount: scream.data().likeCount + 1
        });

        return res.status(200).send({message: 'success'});

    }catch(erorr){
        console.error(erorr);
        return res.status(500).send({error})
    }
}

const unlikeAScream = async ( req, res ) => {
    try{
        const screamId = req.params.screamId;
        if(!screamId)
            return res.status(400).send({message: 'Bad request'});
        const doc = await db.doc(`/screams/${screamId}`).get();
        if(!doc.exists)
            return res.status(404).send({message: 'Scream not found'});
        const likesDoc = await db.collection('likes').where('screamId','==', screamId)
                .where('handle','==', req.user.handle).get()
        if(likesDoc.empty)
            return res.status(404).send({message: 'No like found'})
        const likes = []
        likesDoc.forEach(doc => likes.push({id: doc.id}))

        await db.doc(`/likes/${likes[0].id}`).delete()

        const scream = await db.doc(`/screams/${screamId}`).get();

        await db.doc(`/screams/${screamId}`).update({
            likeCount: scream.data().likeCount - 1
        });

        return res.status(200).send({message: 'Like Deleted Successfully'})

    } catch(error){
        console.error(error);
        return res.status(500).send({ erorr })
    }
}

const deleteAScream = async (req, res) => {
    try{
        const screamId = req.params.screamId;
        if(!screamId)
            return res.status(400).send({message: 'Bad Request', detail: 'screamId is missing'})

        const screamDocs = await db.doc(`/screams/${screamId}`).get()

        if(!screamDocs.exists)
            return res.status(404).send({message: 'Scream not found'})

        await db.doc(`/screams/${screamId}`).delete()


        const likes = await db.collection('likes').where('screamId', '==', screamId).get();

        likes.forEach( async (doc) => {
           await db.doc(`/likes/${doc.id}`).delete();
        })

        const commentsDoc = await db.collection('comments').where('screamId', '==', screamId).get();
        
        commentsDoc.forEach( async (doc) => {
            await db.doc(`/comments/${doc.id}`).delete();
        })

        return res.status(200).send({message: 'Scream deleted successfully'})
    }catch(erorr){
        console.error(erorr);
        return res.status(500).send({ erorr })
    }
}

module.exports = {
    createScream,
    getScream,
    getScreamById,
    commentOnScream,
    likeAScream,
    unlikeAScream,
    deleteAScream
}