import { Router } from "express";
import { Register, UpdateInfo, Info, AuthenticatedUser, TransferCitizen, DeleteCitizen, TransferCitizenReply } from "./controller/user.controller";
import { UserMiddleware, UnauthenticatedUserMiddleware } from "./middleware/user.middleware";

export const routes = (router: Router) => {

    // Info
    router.get('/api/info', Info);

    router.post('/api/citizens/register', Register);
    router.get('/api/citizens/user', UserMiddleware, AuthenticatedUser);
    router.post('/api/citizens/register', Register);
    router.put('/api/citizens/users/info/:userId', UserMiddleware, UpdateInfo);
    router.patch('/api/citizens/transfer', UserMiddleware, TransferCitizen);
    router.patch('/api/citizens/transfer-reply', TransferCitizenReply);
    router.delete('/api/citizens/:userId', UnauthenticatedUserMiddleware, DeleteCitizen);

}
