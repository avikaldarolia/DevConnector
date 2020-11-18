const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try{
        await mongoose.connect(db,{
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false  //to fix one error (video .4th in Profile api route )
        });
        console.log('Mongo DB connected');
    }
    catch(err){
        console.error(err.message);
        //exist process with failure
        process.exit(1);
    }
}

module.exports = connectDB;