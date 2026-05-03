

const router=require('express').Router();
const {adminLogin,getUsersForAdmin}=require('../controller/admin')

router.post('/adminLogin',adminLogin)
router.get('/getUsersForAdmin',getUsersForAdmin)



module.exports=router;