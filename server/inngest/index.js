import { Inngest } from "inngest"
import User from "../models/userSchema.js";
//Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        try {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.create(userData)
         } catch (error) {
            res.status(500).json({ message: 'Internal server error' })
        }
    }
)
// Inngest function to dalete user from database
const syncUserDeletion = inngest.createFunction(

    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        try {
            const { id } = event.data
            await User.findByIdAndDelete(id)
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' })
        }

    }
)
// Inngest function to update user from database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        try {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)
         } catch (error) {
            res.status(500).json({ message: 'Internal server error' })
        }
    }
)


export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];