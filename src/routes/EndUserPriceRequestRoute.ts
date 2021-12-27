import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserPriceRequestView } from "../view/EndUserPriceRequestView";

const router = Router();

router.post('/', (request: Request, response: Response) => {
    myContainer.get<EndUserPriceRequestView>(TYPES.END_USER_PRICE_REQUEST_VIEW).createPriceRequest(request, response);
});


export default router