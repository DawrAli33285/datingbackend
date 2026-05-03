const mongoose=require('mongoose')


// const connection = mongoose.connect('mongodb://admin:StrongPassword123!@127.0.0.1:27017/datingchat?authSource=admin')
 let connection=mongoose.connect('mongodb+srv://dawar:dawar@cluster0.7b9t5dx.mongodb.net')
module.exports=connection
