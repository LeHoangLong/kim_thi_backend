import { Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { TYPES } from "../types";
import { ImageView } from "../view/ImageView";

const router = Router();

router.get('/count', (request: Request, response: Response) => {
    myContainer.get<ImageView>(TYPES.IMAGE_VIEW).fetchNumberOfImages(request, response);
});

router.get('/:id', (request: Request, response: Response) => {
    myContainer.get<ImageView>(TYPES.IMAGE_VIEW).fetchImageById(request, response)
})

router.get('/$', (request: Request, response: Response) => {
    myContainer.get<ImageView>(TYPES.IMAGE_VIEW).fetchImages(request, response);
});

router.post('/', (request: Request, response: Response) => {
    myContainer.get<ImageView>(TYPES.IMAGE_VIEW).createImage(request, response);
});

export default router;