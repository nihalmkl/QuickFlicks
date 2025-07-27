import { Inngest } from "inngest"
import User from "../models/userSchema.js";
import Booking from '../models/bookingSchema.js'
import Show from '../models/showSchema.js'
import sendEmail from "../configs/nodemailer.js";

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
            console.error('Create user error:', error)
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
            console.error('Create user error:', error)
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
                email: email_addresses[0].email_address,
                name: first_name + ' ' + last_name,
                image: image_url
            }
            await User.findByIdAndUpdate(id, userData)
        } catch (error) {
            console.error('Create user error:', error)
        }
    }
)

// Inngest function to cancel booking and release seats after 10 minutes of 
// booking created if payment is not made
const releaseSeatsAndBeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId
            const booking = await Booking.findById(bookingId)

            //if payment is not made , release seats and delete booking
            if (!booking.isPaid) {
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat]
                })

                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }

        })
    }
)

//Inngest Function to send email when user books a show
const sentBookingConfirmationEmail = inngest.createFunction(
    { id: 'send-booking-confirmation-email' },
    { event: 'app/show.booked' },
    async ({ event, step }) => {
        const { bookingId } = event.data
        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: 'movie', model: 'Movie' }
        }).populate('user')
        await sendEmail({
            to: booking.user.email,
            subject: `Booking Confirmation: "${booking.show.movie.titile}" booked 🎬`,
            text: `Hi ${booking.user.name}, your booking (${bookingId}) is confirmed. Thank you! 🍿`,
            body: ` <div style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
            <div style="font-size: 3em; margin-bottom: 15px;">🎟️</div>
            <h1 style="font-size: 2.5em; margin-bottom: 10px; position: relative; z-index: 1; margin: 0 0 10px 0;">🎉 Booking Confirmed!</h1>
            <p style="font-size: 1.1em; opacity: 0.9; position: relative; z-index: 1; margin: 0;">Your movie experience awaits</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 1.2em; color: #333; margin-bottom: 20px;">Hi <strong style="color: #ff6b6b;">${booking.user.name}</strong>,</p>
            
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 15px; margin: 25px 0; text-align: center; border-left: 5px solid #ff6b6b;">
                <strong>🎊 Congratulations! Your booking has been successfully confirmed.</strong><br>
                Get ready for an amazing movie experience!
            </div>
            
            <div style="height: 2px; background: linear-gradient(90deg, transparent, #ff6b6b, transparent); margin: 30px 0;"></div>
            
            <div style="background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid #e8ecff;">
                <h3 style="color: #333; margin-bottom: 25px; font-size: 1.3em; text-align: center; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px; margin: 0 0 25px 0;">📋 Your Booking Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e0e6ff;">
                        <td style="font-weight: 600; color: #555; padding: 15px 0; font-size: 1em; vertical-align: top;">
                            🎬
                        </td>
                        <td style="font-weight: 700; color: #ff6b6b; font-size: 1.1em; padding: 15px 0; text-align: right; vertical-align: top;">
                            ${booking.show.movie.title}
                        </td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e6ff;">
                        <td style="font-weight: 600; color: #555; padding: 15px 0; font-size: 1em; vertical-align: top;">
                            📅
                        </td>
                        <td style="font-weight: 500; color: #333; padding: 15px 0; text-align: right; vertical-align: top;">
                            ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', {
                timeZone: 'Asia/Kolkata'
            })}
                        </td>
                    </tr>
                    
                    <tr style="border-bottom: 1px solid #e0e6ff;">
                        <td style="font-weight: 600; color: #555; padding: 15px 0; font-size: 1em; vertical-align: top;">
                            ⏰
                        </td>
                        <td style="font-weight: 500; color: #333; padding: 15px 0; text-align: right; vertical-align: top;">
                            ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata'
            })}
                        </td>
                    </tr>
                
                    
                    <tr>
                        <td style="font-weight: 600; color: #555; padding: 15px 0; font-size: 1em; vertical-align: top;">
                            🆔
                        </td>
                        <td style="padding: 15px 0; text-align: right; vertical-align: top;">
                            <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 15px; border-radius: 25px; font-family: monospace; font-weight: 600; letter-spacing: 1px; display: inline-block;">
                                ${bookingId}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: linear-gradient(135deg, #ffeaa7, #fab1a0); padding: 25px; border-radius: 15px; margin: 30px 0; text-align: center; font-size: 1.1em; color: #333; border-left: 5px solid #fdcb6e;">
                <strong>🍿 Ready for the show?</strong><br>
                Don't forget to arrive 15 minutes early !<br>
                We hope you have an absolutely fantastic time! 🌟
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-style: italic; margin: 0;">
                    "The magic of movies brings us together" ✨
                </p>

            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #2d3436, #636e72); color: white; padding: 30px; text-align: center;">
            <p style="margin: 5px 0; opacity: 0.9;"><strong style="color: #ff6b6b;">Thank you for choosing us!</strong></p>
            <p style="margin: 5px 0; opacity: 0.9;">🎭 QuickFlicks</p>
            <p style="font-size: 0.9em; margin-top: 15px; margin-bottom: 5px; opacity: 0.9;">
                Questions? Contact us anytime - we're here to help! 💫
            </p>
        </div>
    </div>
    </div>`
        })

    }
)


//Inngest Function to send notifications when a new show is added 
const sendNewShowNotifications = inngest.createFunction(
    { id: "send-new-show-notifications" },
    { event: "app/show.added" },
    async ({ event }) => {
        const { movieTitle } = event.data

        const users = await User.find({})

        for (const user of users) {
            const userEmail = user.email;
            const userName = user.name

            const subject = `🎬 New Show Added: ${movieTitle}`;
            const body = ``;
            await sendEmail({
                to: userEmail,
                subject,
                body,
            })
        }

        return { message: "Notification sent." }
    }
)


export const functions = [syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndBeleteBooking,
    sentBookingConfirmationEmail,
    sendNewShowNotifications];