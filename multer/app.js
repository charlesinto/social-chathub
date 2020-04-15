
const express = require('express');

const bodyParser = require('body-parser');

const multer = require('multer');


const app = express();
 app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const dest = 'uploads/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest);
    },
    filename: (req, file, cb) => {
        console.log(file.fieldname);
      let filename =
        file.fieldname + "-" + Math.random().toString(36).substring(7)+ Date.now() + "." + file.mimetype.split("/")[1];
      cb(null, filename);
    }
  });
  
  const upload = multer({ storage });

  app.post('/image/upload', upload.single('avatar'), (req, res) => {
    
    // const form =  formidable.IncomingForm();

    console.log('form is been processed')

    console.log('>>>>', req.file);

    return res.status(200).send({message:'Uploaded'})
})
let PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on Port ${PORT}`);
  });
