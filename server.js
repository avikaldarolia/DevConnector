const express  = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

//syntax for express. app refers to the name of whole backend application 
const app = express();

//connect database
connectDB();
app.use(cors());
//Init Middleware - (Format for parsing data from API)
app.use(express.json({extended: false}));

// Kind of read only 
app.get('/', (req, res) => res.send('API Running')); 

//DEFINE routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log( `Server started on port ${PORT}`)); 