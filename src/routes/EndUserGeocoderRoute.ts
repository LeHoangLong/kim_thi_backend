import { Request, Response, Router } from "express";
import myContainer from "../inversify.config";
import { TYPES } from "../types";
import { EndUserGeocodingView } from "../view/EndUserGeocodingVIew";

const router = Router();

router.post('/', (request: Request, response: Response) => {
    myContainer.get<EndUserGeocodingView>(TYPES.END_USER_GEOCODER_VIEW).geocode(request, response);
});


export default router