const User=require('../models/user')
const jwt=require('jsonwebtoken')


module.exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

  
        const ADMIN_EMAIL = "pattosuperadmin8839@gmail.com";
        const ADMIN_PASSWORD = "pattopassword";

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return res.status(400).json({
                error: "Invalid email or password"
            });
        }

        const adminPayload = { email };

        let token = await jwt.sign(adminPayload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        console.log(`Admin login successful for: ${email} at ${new Date().toISOString()}`);

        return res.status(200).json({
            loggedIn: true,
            token
        });

    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while trying to login"
        });
    }
};



module.exports.getUsersForAdmin=async(req,res)=>{
    try{
let users=await User.find({})
return res.status(200).json({
    users
})
    }catch(e){
        console.log(e.message);
        return res.status(400).json({
            error: "Error occurred while trying to login"
        });
    }
}