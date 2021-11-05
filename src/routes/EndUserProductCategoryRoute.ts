import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserProductCategoryView } from "../view/EndUserProductCategoryView";

const router = Router();

router.get('/count', (request: Request, response: Response) => {
    myContainer.get<EndUserProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).fetchNumberOfCategoriesView(request, response);
});

router.get('/', (request: Request, response: Response) => {
    myContainer.get<EndUserProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).fetchProductCategoriesView(request, response);
});

export default router