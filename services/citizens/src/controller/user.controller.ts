import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Citizen } from "../entity/citizen.entity";
import { SYNCTYPE } from "../entity/sync-type";
import { publishMessage } from '../rabbitmq/config';
const CircuitBreaker = require("opossum");
import axios from "axios";
import { USER_STATUS } from "../entity/status.enum";

export const Info = async (req: Request, res: Response) => {
    res.send({
        message: 'This is working!',
        path: req.path
    });
}

export const Register = async (req: Request, res: Response) => {

    try {

        console.log('Registering user ... ', req.body);

        const { email, ...body } = req.body;

        const userIsRegistered = await getRepository(Citizen).find({
            email
        });

        const requestFromTransfers = !!req.body.notifyRegistrationToTransfers;

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




        let canCreateUserRegistration = false;

        const userToRegisterToGovCarpeta = {
            ...userToRegister
            , operatorId: process.env.OPERATOR_ID
            , operatorName: process.env.OPERATOR_NAME
        }
        const EXCHANGE_TYPE = 'fanout';

        console.log('Registering user to gov carpeta ... ', userToRegisterToGovCarpeta);

        const options = {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000
        };

        const breaker = new CircuitBreaker(axios.post, options);
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

                if (!requestFromTransfers) await publishMessage('delete_user_from_auth', 'direct', 'delete_user_from_auth', value);

                res.status(501).json({
                    errorCode: 'FAILED_TO_REGISTER_USER_TO_GOV_CARPETA'
                    , error: error?.response?.data
                    , errorDetails: error
                });

            });

        if (!canCreateUserRegistration) {
            res.status(501).json({
                errorCode: 'FAILED_TO_REGISTER_USER'
            });
            return;
        };

        const user = await getRepository(Citizen).save(userToRegister);

        const userToSend = {
            user: { ...user }
            , syncType: SYNCTYPE.creation
        }

        const value = JSON.stringify(
            userToSend
        );

        const EXCHANGE_NAME = 'citizen_to_update';
        const ROUTING_KEY = 'citizen_to_update';

        await publishMessage(EXCHANGE_NAME, EXCHANGE_TYPE, ROUTING_KEY, value);

        if (requestFromTransfers && req.body.operatorUrl) {
            const EXCHANGE_NAME_TRANSFERS_REPLIER = 'citizen_registered_transfers_replier';
            const ROUTING_KEY_TRANSFERS_REPLIER = 'citizen_registered_transfers_replier';
            const userCreated = { ...user };
            userCreated['operatorUrl'] = req.body.operatorUrl;
            console.log('User created to send to transfers replier ... ', userCreated);
            if (req.body.mustSendDocuments) userCreated['Documents'] = req.body.documents;
            await publishMessage(EXCHANGE_NAME_TRANSFERS_REPLIER, 'direct', ROUTING_KEY_TRANSFERS_REPLIER, JSON.stringify(userCreated));
        }

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

    res.send(user);

}

export const AuthenticatedUser = async (req: Request, res: Response) => {
    res.send(req["user"]);
}

export const TransferCitizen = async (req: Request, res: Response) => {

    const citizen = req["user"];

    const userToUnregisterFromGovCarpeta = {
        id: parseInt(citizen.id, 10)
        , operatorId: process.env.OPERATOR_ID.toString()
        , operatorName: process.env.OPERATOR_NAME.toString()
    }

    console.log('Unregistering user from gov carpeta ... ', `${process.env.GOV_CARPETA_BASE_URL}/apis/unregisterCitizen`, userToUnregisterFromGovCarpeta);

    const options = {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
    };

    const breaker = new CircuitBreaker(axios.delete, options);
    await breaker.fire(`${process.env.GOV_CARPETA_BASE_URL}/apis/unregisterCitizen`, { data: userToUnregisterFromGovCarpeta })
        .then(await async function (response) {

            console.log('User unregistered from gov carpeta ... ', response);
            const statusResponseCode = parseInt(response.status);
            if (statusResponseCode > 201) {

                console.log('Failed to unregister user from gov carpeta ... ', response.status, response.data);

                res.status(500).json({
                    errorCode: 'FAILED_TO_UNREGISTER_USER_FROM_GOV_CARPETA'
                    , error: response?.data
                    , errorDetails: response
                });
                return;
            }

            citizen.status = USER_STATUS.transfered;
            await getRepository(Citizen).save(citizen);

            if (req["notifyToReplier"]) {
                citizen.operatorUrl = req.body.operatorUrl;
                const value = JSON.stringify(citizen);
                const QUEUE_NAME = 'citizen_to_delete_and_transfer_replier';

                await publishMessage(QUEUE_NAME, 'direct', QUEUE_NAME, value);
            }


            res.send(citizen);

        })
        .catch(await async function (error) {
            console.log('Failed to unregister user from gov carpeta ... ', error);

            res.status(500).json({
                errorCode: 'FAILED_TO_UNREGISTER_USER_FROM_GOV_CARPETA'
                , error: error?.response?.data
                , errorDetails: error
            });

        });

}

export const TransferCitizenReply = async (req: Request, res: Response) => {

    try {

        const citizenId = parseInt(req.body.userId, 10);

        console.log('Transfer citizen reply citizenId... ', citizenId);

        req["user"] = await getRepository(Citizen).findOne(citizenId);

        req["notifyToReplier"] = true;

        console.log('Transfer citizen reply User... ', req["user"]);

        await TransferCitizen(req, res);

    } catch (error) {
        console.log('Failed to transfer citizen reply ... ', error);

        res.status(500).json({
            errorCode: 'FAILED_TO_TRANSFER_CITIZEN'
            , errorDetails: error
        });

    }

}

export const DeleteCitizen = async (req: Request, res: Response) => {

    try {
        const citizen = req["user"];

        console.log('Deleting citizen ... ', citizen);

        await getRepository(Citizen).delete(citizen.id);

        const userToSend = {
            id: parseInt(citizen.id, 10)
            , email: citizen.email
        }

        const value = JSON.stringify(
            userToSend
        );
        const EXCHANGE_TYPE = 'fanout';
        await publishMessage('delete_user_from_all_system', EXCHANGE_TYPE, 'delete_user_from_all_system', value);

        res.status(201).json({
            message: `Citizen with id ${citizen.id} deleted successfully`
        });

    } catch (error) {
        console.log('Failed to delete citizen ... ', error);

        res.status(500).json({
            errorCode: 'FAILED_TO_DELETE_CITIZEN'
            , errorDetails: error
        });
    }

}

