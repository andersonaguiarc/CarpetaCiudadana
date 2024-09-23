import { Router } from "express";
import { ExternalCitizenRegister, Info } from "./controller/confirm-transfer.controller";

export const routes = (router: Router) => {

    // Info
    router.get('/api/info', Info);

    router.post('/api/citizens/external-register', ExternalCitizenRegister);

}
