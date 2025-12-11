import express from 'express'
import { getFavorite, getUserBookings, updateFavorite } from '../controllers/userController.js'

const userRouter = express.Router()

userRouter.get('/bookings',getUserBookings)
userRouter.get('/favorites',getFavorite)
userRouter.patch('/update-favorite',updateFavorite)

export default userRouter