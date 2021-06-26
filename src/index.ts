import express from 'express';
import cookies from 'cookie-parser';
import { generateContext } from './middleware/Context';
import { TYPES } from './types';
import userRoutes from './routes/UserRoute';
import productRoutes from './routes/ProductRoute';
import { myContainer } from './inversify.config';
import { JwtAuthenticator } from './middleware/JwtAuthenticator';

const app = express();
const port = 80;
const jwtAuthentication = myContainer.get<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR);

app.use(express.json());
app.use(cookies());
app.use(generateContext);
app.use((req, res, next) => {
  if (!req.path.match(/^(\/?)user\/(login|signup)(\/?)/)){
    jwtAuthentication.authenticate(req, res, next)
  } else {
    next();
  }
});
app.use('/user', userRoutes)
app.use('/products', productRoutes)


app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});