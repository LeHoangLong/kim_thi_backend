import express, { NextFunction, Request, Response } from 'express';
import cookies from 'cookie-parser';
import { generateContext } from './middleware/Context';
import { TYPES } from './types';
import userRoutes from './routes/UserRoute';
import productRoutes from './routes/ProductRoute';
import imageRoutes from './routes/ImageRoute';
import pageRoutes from './routes/PageRoute';
import transportFeeRoutes from './routes/TransportFeeRoute';
import productCategoryRoutes from './routes/ProductCategoryRoute';
import endUserProductRoutes from './routes/EndUserProductRoute'
import endUserProductCategoryRoutes from './routes/EndUserProductCategoryRoute'
import endUserGeocodingRoutes from './routes/EndUserGeocoderRoute'
import endUserTransportFeeRoutes from './routes/EndUserAreaTransportFeeRoute'
import endUserOrderRoutes from './routes/EndUserOrderRoute'
import { myContainer } from './inversify.config';
import { JwtAuthenticator } from './middleware/JwtAuthenticator';
import fileUpload from 'express-fileupload'
import { DuplicateResource } from './exception/DuplicateResource';
import { NotFound } from './exception/NotFound';

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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('err.stack')
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.use(function (req, res, next) {
  process.on('unhandledRejection', function(reason: any, p) {
    console.log("Unhandled Rejection:", reason);
    console.log('stack: ' + reason.stack)
    if (!res.headersSent) {
      if (reason instanceof DuplicateResource) {
        res.status(409).send()
      } else if(reason instanceof NotFound) {
        res.status(404).send()
      } else {
        res.status(500).send('Unknown Error');
      }
    }
  });
  next()
});

app.set('views', path.join(__dirname, 'pages/'))

app.use('/backend/user', userRoutes)
app.use('/backend/products', productRoutes)
app.use('/backend/images', imageRoutes)
app.use('/backend/categories', productCategoryRoutes)
app.use('/backend/transport_fees', transportFeeRoutes)
app.use('/backend/enduser/products', endUserProductRoutes)
app.use('/backend/enduser/categories', endUserProductCategoryRoutes)
app.use('/backend/enduser/geocoding', endUserGeocodingRoutes)
app.use('/backend/enduser/transport_fees', endUserTransportFeeRoutes)
app.use('/backend/enduser/orders', endUserOrderRoutes)
app.use('/', pageRoutes)

app.listen(port, async () => {
  if (!process.env.CLOUD) {
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
              console.log('migration finished')
              resolve(true)
            });
        }
      })
    })

    return console.log(`server is listening on ${port}`);
  }
});