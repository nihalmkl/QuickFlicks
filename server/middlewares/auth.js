
import { clerkClient, requireAuth } from '@clerk/express'
export const protectAdmin = async (req,res,next) => {
    try {
        const {userId} = req.auth()
        console.log('hs:',req.auth())
        const user = await clerkClient.users.getUser(userId)
        console.log('Pri',user)
        if(user.privateMetadata.role !== 'admin'){
            return res.json({success:false,message:'Not authorized'})
        }
        next()
    } catch (error) {
         return res.json({success:false,message:'Not authorized'})
    }
}