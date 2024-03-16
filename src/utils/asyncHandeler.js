//method 1 by promise  method 2 are most used in production
const asynchandeler = (requestHandeler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandeler(req, res, next)).catch((err) => next(err))
    }
}

export { asynchandeler };






// const asyncHandler =()=>{()=>{}}

// method 2 by try cattch

// const asyncHandler=(fn)=>async(req,res, next)=>{
//     try {
//         await fn(req,res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }};