
import { clerkClient} from '@clerk/express'

// export const protectAdmin = async (req,res,next) => {
//     try {
//         const {userId} = req.auth()
//         console.log('hs:',req.auth())
//         const user = await clerkClient.users.getUser(userId)
//         if(user.privateMetadata.role !== 'admin'){
//             return res.json({success:false,message:'Not authorized'})
//         }
//         next()
//     } catch (error) {
//          return res.json({success:false,message:'Not authorized'})
//     }
// }


export const protectAdmin = async (req, res, next) => {
  try {
    // 1. Correctly access the auth object
    const auth = req.auth; 
     console.log('auth', auth)
     console.log('userid',auth.userId)
    // 2. Check if userId exists
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 3. Fetch user from Clerk
    const user = await clerkClient.users.getUser(auth.userId);
    
    if (user.privateMetadata.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    next();
  } catch (error) {
    console.error('protectAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}