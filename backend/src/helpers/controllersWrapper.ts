import {Request, Response, NextFunction} from "express";

const controllersWrapper = (ctrl: any) => {
    const func = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ctrl(req, res, next);
        } catch (error) {
            next(error);
        }
    };

    return func;
};

export default controllersWrapper;