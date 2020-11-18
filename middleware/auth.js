const jwt = require('jsonwebtoken');
const config = require('config');

//what is next?? || next is middleware 
module.exports = function(req, res, next){

     // Get the token from header 
     const token = req.header('x-auth-token'); // ??
     
     // Check if not token
     if(!token){
         return res.status(401).json({msg: 'No token, authorization denied.'});

     }

     //verify token
     try {
         //decoded is an object 
         const decoded = jwt.verify(token, config.get('jwtSecret'));
         req.user = decoded.user;
         next(); // 
     } catch (err) {
         res.status(401).json({msg: 'Token is not valid'});
     }
}