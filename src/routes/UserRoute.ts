import { Request, Response, Router } from "express";
import { myContainer } from "../inversify.config";
import { UserAuthorizer } from "../middleware/UserAuthorizer";
import { TYPES } from "../types";
import { UserView } from "../view/UserView";

const router = Router();
const userAuthorizer: UserAuthorizer = myContainer.get<UserAuthorizer>(TYPES.USER_AUTHORIZER);

router.get('/', userAuthorizer.authorize, (request: Request, response: Response) => {
    myContainer.get<UserView>(TYPES.USER_VIEW).getUserView(request, response);
});

router.post('/login', (request: Request, response: Response) => {
    myContainer.get<UserView>(TYPES.USER_VIEW).loginView(request, response);
});

export default router;