import { Request, Response } from "express";
import { publishMessage } from '../rabbitmq/config';

export const Info = async (req: Request, res: Response) => {
    res.send({
        message: 'This is working!',
        path: req.path
    });
}

export const ConfirmCitizenTransfer = async (req: Request, res: Response) => {

    try {

        const citizenToConfirmTransfer = {
            id: req.body.id
        }

        if (citizenToConfirmTransfer.id.toString().length != 10) {
            res.status(501).json({
                error: 'Invalid document'
                , errorCode: 'INVALID_DOCUMENT'
            });
            return;
        }


        console.log('User to delete from citizens ... ', citizenToConfirmTransfer);


        const EXCHANGE_NAME = 'transfer_citizen_confirmation';
        const ROUTING_KEY = 'transfer_citizen_confirmation';

        const value = JSON.stringify(citizenToConfirmTransfer);
        await publishMessage(EXCHANGE_NAME, 'fanout', ROUTING_KEY, value);

        res.status(201).json({
            message: `Citizen with id ${citizenToConfirmTransfer.id} requested to delete`
        });

    } catch (e) {
        console.log('Error registering user CATCH... ', e);
    }
}


