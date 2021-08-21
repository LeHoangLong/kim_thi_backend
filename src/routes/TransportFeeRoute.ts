import { request, Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { TYPES } from "../types";
import { TransportFeeView } from "../view/TransportFeeView";

const router = Router();

router.post('/origins', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).createTransportOriginView(request, response);
});

router.get('/origins/count', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchTransportOriginCountView(request, response);
});

router.get('/origins/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchTransportOriginByIdsView(request, response);
});

router.get('/origins', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchTransportOriginView(request, response);
});

router.put('/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).updateAreaTransportFeeView(request, response);
});

router.delete('/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).deleteAreaTransportFeeView(request, response);
});

router.get('/count', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchNumberOfAreaTransportView(request, response);
});

router.get('/:id', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchAreaTransportDetailView(request, response);
});

router.get('/', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).fetchAreaTransportView(request, response);
});

router.post('/', (request: Request, response: Response) => {
    myContainer.get<TransportFeeView>(TYPES.TRANSPORT_FEE_VIEW).createAreaTransportView(request, response);
});

export default router;