const CustomError = require("../utils/customError");

const adminMiddleware = (req, res, next) =>
{
    if(!req.uesr)
    {
        return next (
            new CustomError(
                "Authentication required",
                401
            )
        );
    }

    if(req.user.role !== "Admin")
    {
        return next(
            new CustomError (
                "Admin access required",
                403
            )
        );
    }

    next();
};

module.exports = adminMiddleware;