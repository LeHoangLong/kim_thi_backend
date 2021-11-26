import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { AdminAuthorizer } from "../middleware/AdminAuthorizer";
import { UserAuthorizer } from "../middleware/UserAuthorizer";
import { TYPES } from "../types";
import { AdminOrderView } from "../view/AdminOrderView";
import { EndUserTransportFeeView } from "../view/EndUserTransportFeeView";

const router = Router();

const userAuthorizer: UserAuthorizer = myContainer.get<UserAuthorizer>(TYPES.USER_AUTHORIZER);
const adminAuthorizer : AdminAuthorizer = myContainer.get<AdminAuthorizer>(TYPES.ADMIN_AUTHORIZER);

router.get('/summaries', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW).fetchOrderSummaries(request, response);
});

router.get('/summaries/count', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW).fetchNumberOfOrders(request, response);
});

router.put(':id/status', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW).updateOrderStatus(request, response);
});

router.get('/:id', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<AdminOrderView>(TYPES.ADMIN_ORDER_VIEW).fetchOrderDetailById(request, response);
});


export default router