import express from 'express';
import cookies from 'cookie-parser';
import { generateContext } from './middleware/Context';
import { TYPES } from './types';
import userRoutes from './routes/UserRoute';
import productRoutes from './routes/ProductRoute';
import imageRoutes from './routes/ImageRoute';
import pageRoutes from './routes/PageRoute';
import { myContainer } from './inversify.config';
import { JwtAuthenticator } from './middleware/JwtAuthenticator';
import fileUpload from 'express-fileupload'
var path = require('path')

const app = express();
const port = 80;
const jwtAuthentication = myContainer.get<JwtAuthenticator>(TYPES.JWT_AUTHENTICATOR);

app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookies());
app.use(generateContext);
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}))
app.use((req, res, next) => {
  if (!req.path.match(/^(\/?)user\/(login|signup)(\/?)/)){
    jwtAuthentication.authenticate(req, res, next)
  } else {
    next();
  }
});

app.set('views', path.join(__dirname, 'pages/'))

app.use('/backend/user', userRoutes)
app.use('/backend/products', productRoutes)
app.use('/backend/images', imageRoutes)
app.use('/', pageRoutes)

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});