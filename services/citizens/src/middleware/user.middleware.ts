import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Citizen } from "../entity/citizen.entity";

export const UserMiddleware = async (req: Request, res: Response, next: Function) => {
    try {
        //const jwt = req.cookies['jwt'];
        const jwtLocation = 1;
        const jwt = req?.headers?.authorization.split(' ')[jwtLocation];
        if (!jwt) {
            return res.status(401).send({
                message: 'unauthenticated'
            });
        }
        const payloadLocation = 1;
        const payload = JSON.parse(atob(jwt.split('.')[payloadLocation]));

        if (!payload) {
            return res.status(401).send({
                message: 'unauthenticated'
            });
        }


        const user = await getRepository(Citizen).findOne({ email: payload.email });

        if (!user) {
            return res.status(401).send({
                message: 'must complete user profile'
            });
        }

        req["user"] = user;

        next();
    } catch (e) {
        return res.status(401).send({
            message: 'unauthenticated'
        });
    }
}

export const UnauthenticatedUserMiddleware = async (req: Request, res: Response, next: Function) => {
    try {

        const userId = parseInt(req?.params?.userId, 10);

        console.log('req?.params?.userId', req?.params?.userId);
        console.log('req?.params', req?.params);
        console.log('userId', userId, typeof userId);

        const user = await getRepository(Citizen).findOne(userId);

        if (!user) {
            return res.status(401).send({
                message: 'user not found'
            });
        }

        req["user"] = user;

        next();
    } catch (e) {
        console.log('Error in UnauthenticatedUserMiddleware', e);
        return res.status(401).send({
            message: 'user not found'
        });
    }
}


