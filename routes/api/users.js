//  { Anything that return a promise we need to put a await infront of it }

const express = require('express');
const router = express.Router();
const {check , validationResult} = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
// we bring in our user model
const User = require('../../models/User');

// @route POST api/users 
// @desc Register user
// @access Public

//we label the call back function as async because we need to use await inside

router.post('/',[
    check('name','Name is required').not().isEmpty(),
    check('email','Please include a valid Email').isEmail(),
    check('password','Please Enter a password with 6 or more characters').isLength({ min:6 })
    ] ,
   async (req,res) => {
    { 
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        //destructuring the req.body 
        const {name, email, password} = req.body;
        
        
        try{

            let user = await User.findOne( {email} );
            //See if the user exists 
            if(user){
               return res.status(400).json( [{msg: 'User already exists'}]);
            }

            //Get users Gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })

            user = new User({  
                name,
                email,
                avatar,
                password
            })

            //Encrypt the Password using bcrypt
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();

            //Return the json webToken 
            //we create a payload which is an object  ??(what is it's purpose)
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