import { Router } from "express";
import { Register, UpdateInfo, Info, AuthenticatedUser } from "./controller/user.controller";
import { UserMiddleware } from "./middleware/user.middleware";

export const routes = (router: Router) => {

    // Info
    router.get('/api/info', Info);

    router.post('/api/citizens/register', Register);
    router.get('/api/citizens/user', UserMiddleware, AuthenticatedUser);
    router.put('/api/citizens/users/info/:userId', UserMiddleware, UpdateInfo);
}
