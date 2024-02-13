
const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((err) => next(err))
    }
}

export {asyncHandler}




//Yedi controller ma kunei async operation perform garda error aayo vane yesle handle hunxa ra tyo error pass hunxa next middleware ma 






/* This is alternative code 
const asyncHandler = (func) => async (req, res, next) => {
    try {
        await func(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}*/