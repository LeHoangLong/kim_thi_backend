import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserOrderView } from "../view/EndUserOrderView";

const router = Router();

router.post('/', (request: Request, response: Response) => {
    myContainer.get<EndUserOrderView>(TYPES.END_USER_ORDER_VIEW).createOrder(request, response);
});


export default router