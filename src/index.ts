import express from 'express';
import cookies from 'cookie-parser';
import { generateContext } from './middleware/Context';
import { TYPES } from './types';
import userRoutes from './routes/UserRoute';
import productRoutes from './routes/ProductRoute';
import imageRoutes from './routes/ImageRoute';
import pageRoutes from './routes/PageRoute';
import transportFeeRoutes from './routes/TransportFeeRoute';
import productCategoryRoutes from './routes/ProductCategoryRoute';
import { myContainer } from './inversify.config';
import { JwtAuthenticator } from './middleware/JwtAuthenticator';
import fileUpload from 'express-fileupload'

console.log('start asdasdasdasdsadas')
var migrate = require('migrate')
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
app.use('/backend/categories', productCategoryRoutes)
app.use('/backend/transport_fees', transportFeeRoutes)
app.use('/', pageRoutes)


app.use(function (error: any, req: express.Request, res: express.Response, next: any) {
  console.error(error.stack)
  res.status(500).send(error)
})

app.listen(port, async () => {
  await new Promise((resolve, reject) => {
    migrate.load({
      stateStore: './migrations-state/.migrate-development'
    }, function(err: any, set: any) {
      if (err) {
        console.log('err')
        console.log(err)
          throw err;
      } else {
          console.log('migrate up')
          set.up('1627888299291-create_transport_fee', function() {
            resolve(true)
          });
      }
    })
  })

  return console.log(`server is listening on ${port}`);
});