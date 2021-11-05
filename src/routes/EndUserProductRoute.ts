import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserProductView } from "../view/EndUserProductView";

const router = Router();

router.get('/summaries', (request: Request, response: Response) => {
    myContainer.get<EndUserProductView>(TYPES.END_USER_PRODUCT_VIEW).fetchProducts(request, response);
});

router.get('/summaries/count', (request: Request, response: Response) => {
    myContainer.get<EndUserProductView>(TYPES.END_USER_PRODUCT_VIEW).fetchProductsCount(request, response);
});

router.get('/:id', (request: Request, response: Response) => {
    myContainer.get<EndUserProductView>(TYPES.END_USER_PRODUCT_VIEW).fetchProductDetailById(request, response)
})

export default router