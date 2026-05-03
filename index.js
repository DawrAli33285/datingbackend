const express=require('express')
const app=express();
const cors=require('cors');
const connection = require('./connection/connection');
const authRoutes=require('./routes/auth')
const userRoutes=require('./routes/user')
const dashboardRoutes=require('./routes/dashboard')
const pactRoutes=require('./routes/pact')
const invitationRoutes=require('./routes/invitation')
const checkInRoutes=require('./routes/pactcheckin')
const subscriptionRoutes=require('./routes/subscription')
const adminRoutes=require('./routes/admin')
require('dotenv').config();
app.use(cors())
const webhookRoute=require('./routes/webhook')
app.use(webhookRoute)
app.use(express.json())
connection


app.use('/api',authRoutes)
app.use('/api',userRoutes)
app.use('/api',dashboardRoutes)
app.use('/api',pactRoutes)
app.use('/api',invitationRoutes)
app.use('/api',checkInRoutes)
app.use('/api',subscriptionRoutes)
app.use('/api',adminRoutes)



app.listen(5000,()=>{
    console.log("Listening to port 5000")
})
