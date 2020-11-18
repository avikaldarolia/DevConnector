
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
// const profile = require('../../models/Profile');
// const user = require('../../models/User');
const {check , validationResult} = require('express-validator/check');
const User = require('../../models/User');
const config = require('config');
const request = require('request');

// @route GET api/profile/me    ..//api/profile will get all the profiles
// @desc get current users profile
// @access Private

//route to fetch our profile 
router.get('/me',auth, async (req,res) => {

    try{    
        const profile = await (await Profile.findOne({user: req.user.id})).populate('user', ['name', 'avatar']);   //for this we made changes in our profile schema under user tag. Also dounts about this req.user.id
        // if there is no user present
        if(!profile){
            return res.status(400).json({msg: 'There is no profile for this user'});
        }   
        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route POST api/profile
// @desc create or update a user profile
// @access Private

router.post('/',[ auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
    ]
], async(req,res)=>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram, 
        linkedin
    } = req.body;

    // Build profile object 
    const profileFields = {};

    // we will add each field one by one
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim())   //split was enough but we need to make sure that it works even if there are multiple space in between thats why we mapped and trimmed each item
    }

    //Build social object 
    profileFields.social = {}

    if (youtube) profileFields.youtube = youtube;
    if (instagram) profileFields.instagram = instagram;
    if (twitter) profileFields.twitter = twitter;
    if (linkedin) profileFields.linkedin = linkedin;
    if (facebook) profileFields.facebook = facebook;

    console.log(profileFields.skills);

    try{
        let profile = await Profile.findOne({user: req.user.id});

        //update (if it already exists)
        if(profile){
            // update
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id}, 
                {$set: profileFields }, //we set our above defined profileFields
                {new: true } // new is an object which is set as true
            );
            return res.json(profile)
        }

        //Create
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile
// @desc get all profiles
// @access Public


router.get('/', async (req,res) =>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);  //in profiles we dont get the name and the avatar. So we use this populate func where 1st argument is from where we are taking what we want to populate, and 2nd argument is the array of items that we want to populate
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @route GET api/profile/user/:user_id
// @desc get profile by user ID
// @access Public
 
router.get('/user/:user_id', async (req,res) =>{
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);  //in profiles we dont get the name and the avatar. So we use this populate func where 1st argument is from where we are taking what we want to populate, and 2nd argument is the array of items that we want to populate
        if(!profile){
            return res.status(400).json({msg: 'Profile not found    for this user'});
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found for this user'});
        }

        res.status(500).send('Server Error');
    }
});

// @route Delete api/profile
// @desc get profile, user and posts
// @access Private
 
router.delete('/',auth, async (req,res) =>{
    try {
        // @todo- remove users posts


        //remove profile
        await Profile.findOneAndRemove({user: req.user.id});
       //Remove the user
        await User.findOneAndRemove({_id: req.user.id});


        res.json({msg:'User deleted'});
    } catch (err) {

        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT api/profile/experience 
// @desc Add profile experience
// @access Private
 
router.put('/experience',[auth, [
     check('title','Title is required').not().isEmpty(),
     check('company','Company is required').not().isEmpty(),
     check('from','From date is required').not().isEmpty()
]], async (req,res) =>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
   
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };
    

    try {
        const profile = await Profile.findOne({user: req.user.id});

        profile.experience.unshift(newExp);  //unshift pushes in the begining rather than the end.( profile.experience is an array)
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route DELETE api/profile/experience/:exp_id  (colon(:) is for place holder)
// @desc Delete a profile experience
// @access Private

router.delete('/experience/:exp_id', auth , async (req,res)=>{
    try {
        const profile = await Profile.findOne({user: req.user.id});
        
        //get remove index
        const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);  //we want to match our item id to req.params.exp_id
        
        profile.experience.splice(removeIndex,1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route PUT api/profile/education 
// @desc Add profile education
// @access Private
 
router.put('/education',[auth, [
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()
]], async (req,res) =>{
   const errors = validationResult(req);

   if(!errors.isEmpty()){
       return res.status(400).json({errors: errors.array()});
   }
  
   const {
       school,
       degree,
       fieldofstudy,
       from,
       to,
       current,
       description
   } = req.body;

   const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
   };
   

   try {
       const profile = await Profile.findOne({user: req.user.id});

       profile.education.unshift(newEdu);  //unshift pushes in the begining rather than the end.( profile.experience is an array)
       await profile.save();
       return res.json(profile);
   } catch (err) {
       console.error(err.message);
       res.status(500).send('Server Error');
   }
});


// @route DELETE api/profile/education/:edu_id  (colon(:) is for place holder)
// @desc Delete a profile education
// @access Private

router.delete('/education/:edu_id', auth , async (req,res)=>{
   try {
       const profile = await Profile.findOne({user: req.user.id});
       
       //get remove index
       const removeIndex = profile.education
       .map(item => item.id)
       .indexOf(req.params.edu_id);  //we want to match our item id to req.params.exp_id
       
       profile.education.splice(removeIndex,1);

       await profile.save();

       res.json(profile);
   } catch (err) {
       console.error(err.message);
       res.status(500).send('Server Error');
   }
});

// @route GET api/profile/github/:username
// @desc Get user repos from Github
// @access Public

router.get('/github/:username', (req,res) =>{
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=
            ${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js'}
        };

        request(options, (error, response, body)=>{
            if(error){
                console.error(error);
            }

            //if it's not a 200 response we send back 404 Status
            if(response.statusCode!==200){
               return res.status(404).json({msg: 'No github profile found'})
            }

            res.json(JSON.parse(body));
        })
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;
