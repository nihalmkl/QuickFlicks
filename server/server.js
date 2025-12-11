import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js'
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRouter.js'
import bookingRouter from './routes/bookingRouter.js'
import adminRouter from './routes/adminRouter.js'
import userRouter from './routes/userRouter.js'
import { stripeWebhooks } from './controllers/stripeWebhooks.js'

const app = express()
app.use(clerkMiddleware())
const port = process.env.PORT || 3000
await connectDB()
app.use('/api/stripe',express.raw({type:'application/json'}),stripeWebhooks)
//Middlewares
app.use(express.json())
app.use(cors())

//API Routes
app.get('/',(req,res)=> res.send('Sever is live'))
app.use("/api/inngest", serve({ client: inngest, functions }))
app.use('/api/show',showRouter)
app.use('/api/booking',bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)


app.listen(port,()=>{
    console.log(`Sever listening at http://localhost:${port}`)
})