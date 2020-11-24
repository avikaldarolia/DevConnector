const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const config = require('config');
const bcrypt = require('bcryptjs');
const {check , validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

// @route GET api/auth
// @desc Test route
// @access Public

//what is the middle arguement => It makes this route protected. 
//the middle argument auth is the middleware we created. 
router.get('/', auth, async (req,res) => {
    try {
       const user = await 
       User.findById(req.user.id).select('-password');   //couldn't it be req.body.id
       res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
   
});


// @route POST api/auth
// @desc Authenticate user and get token
// @access Public

//we label the call back function as async because we need to use await inside

router.post('/',[
    check('email','Please include a valid Email').isEmail(),
    check('password','Password is required').exists()
    ] ,
   async (req,res) => {
    { 
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        //destructuring the req.body 
        const { email, password } = req.body;
        
        
        try{
            let user = await User.findOne( {email} );
             //See if the user exists 
            if(!user){
               return res.status(400).json( [{msg: 'Invalid credentials'}]);
            }

            //we compare the 2 passwords (1st is entered by user and 2nd is actual one)
            const isMatch = await bcrypt.compare(password, user.password);
           
            if(!isMatch){
                return res,status(400).json({errors: [{msg: 'Invalid credentials'}]});
            }

            //we create a payload which is an object 
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                //callback func, either we get an error or a token
                (err,token)=> { 
                    if(err) throw err;
                    res.json({token});
                });
            // res.send('User Registered')
        }catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        } 

        
    }
});
module.exports = router;