import { Router } from "express";
import { productDetailPage, productSearchPage, productSummaryPage } from "../view/PageView";

const router = Router();

router.get('/search', productSearchPage)
router.get('/products/:productId', productDetailPage)
router.get('/', productSummaryPage)

export default router;