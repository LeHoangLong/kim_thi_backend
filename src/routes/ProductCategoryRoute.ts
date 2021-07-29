import { Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { AdminAuthorizer } from "../middleware/AdminAuthorizer";
import { UserAuthorizer } from "../middleware/UserAuthorizer";
import { TYPES } from "../types";
import { ProductCategoryView } from "../view/ProductCategoryView";

const router = Router();
const userAuthorizer: UserAuthorizer = myContainer.get<UserAuthorizer>(TYPES.USER_AUTHORIZER);
const adminAuthorizer : AdminAuthorizer = myContainer.get<AdminAuthorizer>(TYPES.ADMIN_AUTHORIZER);

router.get('/count', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).fetchNumberOfCategoriesView(request, response);
});

router.delete('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).deleteProductCategoriesView(request, response);
});

router.post('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).createProductCategoryView(request, response);
});

router.get('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductCategoryView>(TYPES.PRODUCT_CATEGORY_VIEW).fetchProductCategoriesView(request, response);
});

export default router;