import { Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { TYPES } from "../types";
import { TransportFeeView } from "../view/TransportFeeView";

const router = Router();

router.put('/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).updateAreaTransportFeeView(request, response);
});

router.delete('/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).deleteAreaTransportFeeView(request, response);
});

router.get('/count', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchNumberOfAreaTransportView(request, response);
});

router.get('/', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchAreaTransportView(request, response);
});

router.post('/', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).createAreaTransportView(request, response);
});

export default router;