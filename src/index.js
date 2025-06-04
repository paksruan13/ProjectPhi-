require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const app = express();
const port = process.env.PORT || 4000;
const{ PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer();
const {v4: uuid} = require('uuid');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Stripe Webhook
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('Webhook handler executing...');
  
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    console.log('No signature header');
    return res.status(400).send('No signature');
  }

  let event;

  try {
    console.log('Verifying signature...');  
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Signature verified, Event type:', event.type);
  } catch (err) {
    console.log('Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Processing payment:', session.id);
    console.log('Amount:', session.amount_total / 100);
    console.log('Metadata:', session.metadata);
    
    await handleCompletedPayment(session);
  }

  res.json({received: true});
});

// Webhook handler function
async function handleCompletedPayment(session) {
  try {
    const { teamId, userId } = session.metadata || {};
    const amount = session.amount_total / 100; // Convert from cents
    
    if (!teamId) {
      console.error('No teamId in session metadata');
      return;
    }

    const donation = await prisma.donation.create({
      data: {
        amount,
        currency: session.currency,
        stripeSessionId: session.id,
        user: userId ? { connect: { id: userId } } : undefined,
        team: { connect: { id: teamId } },
      },
    });
    
    console.log('Donation saved:', donation.id);
    
    // TODO: Publish to Redis for real-time updates
    await redis.publish('donation:created', JSON.stringify({
      teamId,
      amount,
      donationId: donation.id
    }));
    
  } catch (error) {
    console.error('Error handling completed payment:', error);
  }
}

app.use(express.json());

// 3. Postgres
const db = new Pool({
  host:     process.env.DB_HOST,
  port:     +process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 4. Redis
const redis = new Redis(process.env.REDIS_URL);
redis.on('error', err => console.error('Redis error:', err.message));

// 5. S3 (MinIO) – now that env is loaded
const minioEndpoint = `http://${process.env.MINIO_ENDPOINT}`;
const s3 = new S3Client({
  endpoint:      minioEndpoint,     // e.g. "http://localhost:9000"
  region:        'us-east-1',
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

// 6. health‐check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 7. test upload route
app.post('/test-upload', express.text(), async (req, res) => {
  try {
    console.log('Uploading to MinIO at:', minioEndpoint);
    await s3.send(new PutObjectCommand({
      Bucket: 'test-bucket',
      Key:    'hello.txt',
      Body:   'Hello, MinIO!',
    }));
    return res.json({ success: true });
  } catch (err) {
    console.error('MinIO upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

//List all teams
app.get('/teams', async(req, res) => {
  try{
    const teams = await prisma.team.findMany();
    return res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({error: err.message});
  }
});

app.get('/teams/:id/score', async(req,res) =>{
  const { id } = req.params;
  try{
    const team = await prisma.team.findUnique({
      where:{ id },
      include:{
        donations: { select: { amount: true}},
        shirtSales: { select:{ quantity: true}},
      },
    });
    if(!team) return res.status(404).json({error: 'team not found'});

    const donationSum = team.donations.reduce((sum, d) => sum + d.amount, 0);
    const shirtPoints = team.shirtSales.reduce((sum, s) => sum + s.quantity, 0);
    res.json({teamId: id, score: donationSum + shirtPoints});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
})

app.post('/teams', async(req, res) => {
  const { name } = req.body;
  if(!name) {
    return res.status(400).json({error:'Name is required'});
  }
  try{
    const team = await prisma.team.create({
      data: { name },
    });
    return res.status(201).json(team);
  } catch(err) {
    console.error('Error creating team:', err);
    return res.status(500).json({error:err.message});
  }
})

//User api + params
app.post('/users', async(req, res) => {
  const {name, email, teamId} = req.body;
  if(!name || !email){
    return res.status(400).json({error: 'Name and Email are required'});
  }
  try{
    const user = await prisma.user.create({
      data: {name, email, team: teamId ? { connect: {id: teamId } } : undefined},
    });
    return res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({error: err.message});
  }
});

app.get('/users', async(req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {team: {select: {id :true, name: true}}},
    });
    return res.json(users);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({error: err.message});
  }
});

//Donations API
app.post('/donations', async(req, res) => {
  const {amount, currency = 'usd', userId, teamId } = req.body;
  if(amount == null || !teamId){
    return res.status(400).json({
      error: 'amount (number) and teamId (UUID) are required'
    });
  }
  try {
    const donation = await prisma.donation.create({
      data: {
        amount,
        currency,
        user: userId ? {connect: {id: userId}} : undefined,
        team: {connect: {id: teamId}},
      },
      include: {
        user: {select: {id: true, name: true, email: true}},
        team: {select: {id: true, name: true}},
      }
    });
    return res.status(201).json(donation);
  } catch(err) {
    console.error('Error creating donationL', err);
    return res.status(500).json({error: err.message});
  }
});

app.get('/donations', async(req, res) => {
  try{
    const donations = await prisma.donation.findMany({
      orderBy: {createdAt: 'desc'},
      include: {
        user: {select: {id: true, name: true, email: true}},
        team: {select: {id: true, name: true}},
      }
    });
    return res.json(donations);
  } catch (err) {
    console.error('Error fetching donations:', err);
    return res.status(500).json({error: err.message});
  }
})

//sales API
app.post('/sales', async(req, res) => {
  const {quantity, teamId} = req.body;
  if(quantity == null || !teamId) {
    return res.status(400).json({
      error: 'quantity (number) and teamId (UUID) are required'
    });
  }
  try{
    const sale = await prisma.shirtSale.create({
      data: {
        quantity,
        team: {connect: {id: teamId}},
      },
      include: {
        team: {select: {id: true, name: true}},
      },
    });
    return res.status(201).json(sale);
  } catch (err) {
    console.error('Error creating shirt sale:', err);
    return res.status(500).json({error: err.message});
  }
})

app.get('/sales', async(req, res) => {
  try{
    const sales = await prisma.shirtSale.findMany({
      orderBy: {soldAt: 'desc'},
      include: {
        team: {select: {id: true, name: true}},
      },
    });
    return res.json(sales);
  } catch (err) {
    console.error('Error fetching shirt sales:', err);
    return res.status(500).json({error: err.message});
  }
})

//Photos API
app.post('/photos', upload.single('file'), async(req, res) => {
  const {teamId} = req.body;
  if(!teamId || !req.file) {
    return res.status(400).json({error: 'file (binary) and teamId are required'});
  }

  const objectKey = `photos/${uuid()}-${req.file.originalname}`;
  try{
    await s3.send(new PutObjectCommand({
      Bucket: 'test-bucket',
      Key: objectKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));
    const url = `http://${process.env.MINIO_ENDPOINT}/test-bucket/${objectKey}`;
    const photo = await prisma.photo.create({
      data: {
        url,
        team: {connect: {id: teamId}},
      },
      include: {team: {select: {id: true, name: true}}},
    });
    return res.status(201).json(photo);
  } catch (err) {
    console.error('Error uploading photo:', err);
    return res.status(500).json({error: err.message});
  }
});

app.get('/photos', async(req, res) => {
  try{
    const photos = await prisma.photo.findMany({
      orderBy: {uploadedAt: 'desc'},
      include: {team: {select: {id: true, name: true}}},
    });
    return res.json(photos);
  } catch(err) {
    console.error('Error fetching photos:', err);
    return res.status(500).json({error: err.message});
  }
})

//Stripe API

app.post('/create-checkout-session', express.json(), async(req, res) => {
  const{teamId, userId, amount} = req.body;
  try{
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {name: 'Donation'},
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: {teamId, userId},
      success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/cancel"
    });
    res.json({url: session.url});
  } catch(err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({error: err.message});
  }
});

app.listen(4242, '0.0.0.0', () => {
  console.log('Express listening at http://0.0.0.0:4242');
});
