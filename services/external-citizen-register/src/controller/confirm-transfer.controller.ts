import { Request, Response } from "express";
import { publishMessage } from '../rabbitmq/config';

export const Info = async (req: Request, res: Response) => {
    res.send({
        message: 'This is working!',
        path: req.path
    });
}

export const ExternalCitizenRegister = async (req: Request, res: Response) => {

    try {

        const externalCitizen = {
            id: req.body.id
            , name: req.body.citizenName
            , email: req.body.citizenEmail
            , documents: req.body.Documents
            , confirmationURL: req.body.confirmationURL
        }

        console.log('externalCitizen: ', externalCitizen);

        if (externalCitizen.id.toString().length != 10) {
            res.status(501).json({
                error: 'Invalid document'
                , errorCode: 'INVALID_DOCUMENT'
            });
            return;
        }

        const EXCHANGE_NAME = 'external_citizen_to_register';
        const ROUTING_KEY = 'external_citizen_to_register';

        const value = JSON.stringify(externalCitizen);
        await publishMessage(EXCHANGE_NAME, 'direct', ROUTING_KEY, value);

        res.status(201).json({
            message: `Citizen with id ${externalCitizen.id} requested to register successfully`
        });

    } catch (e) {
        console.log('Error registering user CATCH... ', e);
        res.status(500).json({
            error: 'Failed to register user'
        });
    }
}


