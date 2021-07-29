import { Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { AdminAuthorizer } from "../middleware/AdminAuthorizer";
import { UserAuthorizer } from "../middleware/UserAuthorizer";
import { TYPES } from "../types";
import { ProductView } from "../view/ProductView";

const router = Router();
const userAuthorizer: UserAuthorizer = myContainer.get<UserAuthorizer>(TYPES.USER_AUTHORIZER);
const adminAuthorizer : AdminAuthorizer = myContainer.get<AdminAuthorizer>(TYPES.ADMIN_AUTHORIZER);

router.get('/summaries', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).fetchProducts(request, response);
});

router.get('/summaries/count', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).fetchProductsCount(request, response);
});

router.post('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).createProduct(request, response)
})

router.delete('/', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).deleteProduct(request, response)
})

router.get('/:id', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).fetchProductDetailById(request, response)
})

router.put('/:id', userAuthorizer.authorize, adminAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<ProductView>(TYPES.PRODUCT_VIEW).updateProduct(request, response)
})
export default router;