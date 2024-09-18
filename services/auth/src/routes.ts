import {Router} from "express";
import {Login as SignIn, SignOut, Register, UpdatePassword, Info} from "./controller/auth.controller";

export const routes = (router: Router) => {

    // Info
    router.get('/api/info', Info);
    

    router.post('/api/citizens/register', Register);
    router.post('/api/citizens/login', SignIn);
    router.post('/api/citizens/logout',SignOut);
    //router.put('/api/ambassador/users/password', UpdatePassword);
}
