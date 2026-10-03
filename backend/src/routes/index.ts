import { Router } from 'express';
import authRoutes from './authRoutes.js';
import listingsRoutes from './listingsRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import sellerRoutes from './sellerRoutes.js';
import adminRoutes from './adminRoutes.js';
import haatsRoutes from './haatsRoutes.js';
import categoriesRoutes from './categoriesRoutes.js';
import reviewsRoutes from './reviewsRoutes.js';
import notificationsRoutes from './notificationsRoutes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Thaluwa Bazar Backend API (থলুৱা বজাৰ)',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/listings', listingsRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/seller', sellerRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/haats', haatsRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/reviews', reviewsRoutes);
apiRouter.use('/notifications', notificationsRoutes);

export default apiRouter;
