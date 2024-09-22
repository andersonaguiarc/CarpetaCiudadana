import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Citizen } from "../entity/citizen.entity";
import { SYNCTYPE } from "../entity/sync-type";
import { publishMessage } from '../rabbitmq/config';
const CircuitBreaker = require("opossum");
import axios from "axios";

export const Info = async (req: Request, res: Response) => {
    res.send({
        message: 'This is working!',
        path: req.path
    });
}

export const Register = async (req: Request, res: Response) => {

    try {



        const { email, ...body } = req.body;

        const userIsRegistered = await getRepository(Citizen).find({
            email
        });

        const userToRegister = {
            id: req.body.id
            , name: req.body.name
            , address: req.body.address
            , email
        }

        if (!!userIsRegistered.length) {
            res.status(400).json({
                error: 'Email already exist'
                , errorCode: 'EMAIL_EXISTS'
            });
            return;
        }

        if (userToRegister.id.toString().length != 10) {
            res.status(501).json({
                error: 'Invalid document'
                , errorCode: 'INVALID_DOCUMENT'
            });
            return;
        }


        const options = {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000
        };

        const breaker = new CircuitBreaker(axios.post, options);

        let canCreateUserRegistration = false;

        const userToRegisterToGovCarpeta = {
            ...userToRegister
            , operatorId: process.env.OPERATOR_ID
            , operatorName: process.env.OPERATOR_NAME
        }
        const EXCHANGE_TYPE = 'fanout';

        console.log('Registering user to gov carpeta ... ', userToRegisterToGovCarpeta);

        await breaker.fire(`${process.env.GOV_CARPETA_BASE_URL}/apis/registerCitizen`, userToRegisterToGovCarpeta)
            .then(function (response) {

                console.log('User registered to gov carpeta ... ', response.data);

                canCreateUserRegistration = true;
            })
            .catch(await async function (error) {

                console.log('Failed to register user to gov carpeta ... ', error.response);

                const value = JSON.stringify({
                    id: userToRegister.id
                    , email: userToRegister.email
                });

                await publishMessage('delete_user_from_auth', 'direct', 'delete_user_from_auth', value);

                res.status(501).json({
                    errorCode: 'FAILED_TO_REGISTER_USER_TO_GOV_CARPETA'
                    , error: error?.response?.data
                    , errorDetails: error
                });

            });

        if (!canCreateUserRegistration) return;

        const user = await getRepository(Citizen).save(userToRegister);

        const userToSend = {
            user
            , syncType: SYNCTYPE.creation
        }

        const value = JSON.stringify(
            userToSend
        );

        const EXCHANGE_NAME = 'citizen_to_update';
        const ROUTING_KEY = 'citizen_to_update';

        await publishMessage(EXCHANGE_NAME, EXCHANGE_TYPE, ROUTING_KEY, value);

        res.send(user);

    } catch (e) {
        console.log('Error registering user CATCH... ', e);
    }
}

export const UpdateInfo = async (req: Request, res: Response) => {

    const userId = req.params.userId;

    const repository = getRepository(Citizen);

    if (req?.body?.email != req["user"]?.email) {
        res.status(400).json({
            error: 'Emails user cannt be modified'
        });
        return;
    }

    await repository.update(userId, req.body);

    const user = await repository.findOne(userId);

    const userToSend = {
        user
        , syncType: SYNCTYPE.update
    }


    const value = JSON.stringify(
        userToSend
    );





    /*await producer.connect();
    await producer.send({
        topic: 'users-sync',
        messages: [
            { value }
        ]
    });*/

    res.send(user);

}

export const AuthenticatedUser = async (req: Request, res: Response) => {
    res.send(req["user"]);
}
