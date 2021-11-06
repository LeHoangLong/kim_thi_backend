import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserTransportFeeView } from "../view/EndUserTransportFeeView";

const router = Router();

router.get('/area', (request: Request, response: Response) => {
    myContainer.get<EndUserTransportFeeView>(TYPES.END_USER_TRANSPORT_FEE_VIEW).fetchAreaTransportFee(request, response);
});

router.get('/bill_based', (request: Request, response: Response) => {
    myContainer.get<EndUserTransportFeeView>(TYPES.END_USER_TRANSPORT_FEE_VIEW).fetchBillBasedTransportFee(request, response);
});


export default router