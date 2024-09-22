import { Router } from "express";
import { ConfirmCitizenTransfer, Info } from "./controller/confirm-transfer.controller";

export const routes = (router: Router) => {

    // Info
    router.get('/api/info', Info);

    router.post('/api/citizens/confirm-transfer', ConfirmCitizenTransfer);

}
