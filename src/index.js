require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const app = express();
const port = process.env.PORT || 4243;
const{ PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer();
const {v4: uuid} = require('uuid');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const { Server, Socket } = require('socket.io');
const http = require('http');
const { timeStamp, time } = require('console');
const { emit } = require('process');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust to frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", 'stripe-signature'],
  },
});

app.use(cors({
  origin: ["http://localhost:5173"], // Adjust to your frontend URL
  credentials: true, // Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", 'stripe-signature'],
}))

// Stripe webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('Executing webhook handler...');
  
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    console.log('No signature header');
    return res.status(400).send('No signature');
  }

  let event;

  try {
    console.log('Attempting signature verification...');  
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Signature verified! Event type:', event.type);
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

// 5. S3
const minioEndpoint = `http://${process.env.MINIO_ENDPOINT}`;
const s3 = new S3Client({
  endpoint:      minioEndpoint,     
  region:        'us-east-1',
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

// 6. health‐check
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Connected',
      redis: 'Connected',
      s3: 'Connected',
    }
  })
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
    await emitLeaderboardUpdate(); // Emit update so socket receives
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
    if(teamId) {
      await emitLeaderboardUpdate();
    }
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

app.get('/leaderboard', async (req, res) => {
  try{
    const teams = await prisma.team.findMany({
      include:{
        donations:{
          select: {amount: true},
        },
        shirtSales:{
          select: {quantity: true},
        },
        photos:{
          select: {approved: true},
        },
        _count: {
          select:{
            donations: true,
            shirtSales: true,
            photos: true,
          }
        }
      }
    });

    const leaderboard = await Promise.all(teams.map(async team => {
      const totalDonations = team.donations.reduce((sum, donation) => sum + donation.amount, 0);
      const totalShirtPoints = team.shirtSales.reduce((sum, sale) => sum + (sale.quantity * 10), 0); //sale quantity * 10 to make each shirt worth 10 points
      const approvedPhotos = team.photos.filter(photo => photo.approved);
      const totalPhotoPoints = approvedPhotos.length * 50; // Assuming each approved photo is worth 50 points
      const totalScore = totalDonations + totalShirtPoints + totalPhotoPoints;
      const memberCount = await prisma.user.count({
        where: {teamId: team.id},
      });
      return {
        id: team.id,
        name: team.name,
        totalScore : totalScore,
        totalDonations: totalDonations,
        totalShirtPoints: totalShirtPoints,
        donationCount: team._count.donations,
        shirtSaleCount: team._count.shirtSales,
        totalPhotoPoints: totalPhotoPoints,
        approvedPhotosCount: approvedPhotos.length,
        photoCount: team._count.photos,
        memberCount: memberCount,
        createdAt: team.createdAt
      };
    }));
    leaderboard.sort((a, b) => b.totalScore - a.totalScore); // Sort by total score
    // Add rank to each team
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    })); 
    res.json(rankedLeaderboard); 
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({error: err.message});
  }
});

io.on('connection', (socket) => {
  console.log(socket.id, 'connected');

  socket.join('leaderboard'); // Join room
  socket.on('join-leaderboard', () => {
    socket.join('leaderboard');
  });

  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnected');
  });

})

async function emitLeaderboardUpdate() { //live leaderboard update
  try{
    const teams = await prisma.team.findMany({
      include:{
        donations: {select: {amount: true}},
        shirtSales: {select: {quantity: true}},
        photos: {select: {approved: true}},
        _count: {
          select: {
            donations: true,
            shirtSales: true,
            photos: true,
          }
        }
      }
    });
    const leaderboard = await Promise.all(teams.map(async team => {
      const totalDonations = team.donations.reduce((sum, donation) => sum + donation.amount, 0);
      const totalShirtPoints = team.shirtSales.reduce((sum, sale) => sum + (sale.quantity * 10), 0);
      const approvedPhotos = team.photos.filter(photo => photo.approved);
      const totalPhotoPoints = approvedPhotos.length * 50; // Assuming each approved photo is  5 points
      const totalScore = totalDonations + totalShirtPoints + totalPhotoPoints;
      const memberCount = await prisma.user.count({
        where: {teamId: team.id},
      });
      return {
        id: team.id,
        name: team.name,
        totalScore: totalScore,
        totalDonations: totalDonations,
        totalShirtPoints: totalShirtPoints,
        donationCount: team._count.donations,
        shirtSaleCount: team._count.shirtSales,
        totalPhotoPoints: totalPhotoPoints,
        approvedPhotosCount: approvedPhotos.length,
        photoCount: team._count.photos,
        memberCount: memberCount,
        createdAt: team.createdAt
      };
    }));

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
    io.to('leaderboard').emit('leaderboard-update', rankedLeaderboard);
    console.log('Leaderboard update emitted to clients');
  } catch(err){
    console.error('Error emitting leaderboard update:', err);
  }
}

//webhook 
async function handleCompletedPayment(session){
  try{
    const {teamId, userId} = session.metadata || {};
    const amount = session.amount_total / 100;
    if(!teamId){
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

    await emitLeaderboardUpdate();
    
  } catch(err) {
    console.error('Error handling completed payment:', err);
  }
}


app.get('/photos/pending', async (req, res) => {
  try {
    const pendingPhotos = await prisma.photo.findMany({
      where: {approved: false},
      orderBy: {uploadedAt: 'desc'},
      include: {team: {select: {id: true, name: true}}},
    });
    return res.json(pendingPhotos);
  } catch (err) {
    console.error('Error fetching pending photos:', err);
    return res.status(500).json({error: err.message});
  }
})

app.put('/photos/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const photo = await prisma.photo.update({
      where: { id },
      data: { approved: true },
      include: { team: { select: { id: true, name: true } } },
    });

    console.log('Photo Approved!', photo.id, 'for team:', photo.team.name);
    await emitLeaderboardUpdate();
    io.to('leaderboard').emit('photo-approved', {
      photoId: photo.id,
      teamId: photo.team.id,
      teamName: photo.team.name,
      timeStamp: new Date(),
  });
  return res.json(photo);
  } catch (err) {
    console.error('Error approving photo:', err);
    return res.status(500).json({error: err.message});
  }
});

app.put('/photos/:id/reject', async(req, res) => {
  const {id} = req.params;
  const {reason} = req.body;

  try{
    const photo = await prisma.photo.delete({
      where: {id}
    });
    console.log('Photo Rejected!', photo.id);

    io.to('leaderboard').emit('photo-rejected', {
      photoId: photo.id,
      reason,
      timeStamp: new Date(),
    });

    return res.json({message: 'Photo Rejected and Removed'});
  } catch (err) {
    console.error('Error rejecting photo:', err);
    return res.status(500).json({error: err.message});
  }
})

app.get('/photos/approved', async (req, res) => {
  try{
    const approvedPhotos = await prisma.photo.findMany({
      where: {approved: true},
      orderBy: {uploadedAt: 'desc'},
      include: {team: {select: {id: true, name: true}}},
    });
    return res.json(approvedPhotos);
  } catch (err) { 
    console.error('Error fetching approved photos:', err);
    return res.status(500).json({error: err.message});
  }
})

const authenticationToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(!token) {
    return res.status(401).json({error: 'Access token is required'});
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({error: 'Invalid token'});
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)){
      return res.status(403).json({error: 'Forbidden: Insufficient permissions'});
    }
    next();
  };
};

app.post('/auth/register', async (req, res) => {
  try {
    const {name, email, password, role = 'STUDENT', teamId} = req.body;
    const existingUser = await prisma.user.findUnique({ where: {email} });
    if(existingUser) {
      return res.status(400).json({error: 'User already exists'});
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        teamId: teamId || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {select: {id: true, name: true}},
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({error: 'Internal server error'});
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const {email, password} = req.body;

    const user = await prisma.user.findUnique({
      where: {email}, include: {team: true, coachedTeams: true}
    });

    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }

    const validPassword =  await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({error: 'Invalid password'});
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        coachedTeams: user.coachedTeams
      },
      token,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({error: 'Internal server error'});
}
});

app.get('/auth/me', authenticationToken, async (req, res) => { 
  try {
    const user = await prisma.user.findUnique({
      where: {id: req.user.id},
      include: {team: true, coachedTeams: true},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        coachedTeams: true
      }
    });
    if (!user) {
      return res.status(404).json({error: 'User not found'});
    }
    res.json({user})
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({error: 'Internal server error'});
  }
}) //Get current user info

app.get('/admin/users', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: { select: {id: true, name: true, teamCode: true}},
        coachedTeams: { select: {id: true, name: true, teamCode: true}},
      },
      orderBy: {createdAt: 'desc'},
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({error: 'Internal server error'});
  }
});

app.get('/admin/teams', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include:{
        members: {
          select: {id: true, name: true, email: true, role: true},
        },
        coach: {
          select: {id: true, name: true, email: true},
        },
        _count: {
          select: {
            members: true,
            donations: true,
            shirtSales: true,
            photos: true,
          }
        }
      },
      orderBy: {createdAt: 'desc'},
    });
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({error: 'Failed to fetch teams'});
}
});

app.post('/admin/teams', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {name, coachId} = req.body;
    const generateTeamCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };
    let teamCode;
    let isUnique = false;
    while (!isUnique) {
      teamCode = generateTeamCode();
      const existingTeam = await prisma.team.findUnique({ where: { teamCode } });
      if (!existingTeam) {
        isUnique = true;
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        teamCode,
        coachId: coachId || null
      },
      include: {
        coach: {
          select: {id: true, name: true, email: true},
        }
      } 
    });

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({error: 'Failed to create team'});
  }
});

app.put('/admin/teams/:id', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {id} = req.params;
    const {name, coachId, isActive} = req.body;
    const team = await prisma.team.update({
      where: {id},
      data: {
        name, coachId: coachId || null, isActive
      },
      include: {
        coach: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true, role: true },
        }
      }
    });
    res.json({
      message: 'Team updated successfully',
      team,
    });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({error: 'Failed to update team'});
  }
})

app.put('/admin/users/:id', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {id} = req.params;
    const {role, teamId, isActive} = req.body;

    const user = await prisma.user.update({
      where: {id},
      data: {
        role,
        teamId: teamId || null,
        isActive
      },
      include: {
        team: {select: {id: true, name: true, teamCode: true}},
      }
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({error: 'Failed to update user'});
  }
});

app.get('/admin/coaches', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
    try {
      const coaches = await prisma.user.findMany({
        where: { role: 'COACH', isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          coachedTeams: {select: {id: true, name: true}},
        },
        orderBy: {createdAt: 'desc'},
      });
      res.json(coaches);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      res.status(500).json({error: 'Failed to fetch coaches'});
    }
})

app.post('/auth/register-team', async(req, res) => {
  try {
    const {teamCode, name, email, password} = req.body;
    const team = await prisma.team.findUnique({
      where: {teamCode},
      select: {id: true, name: true, isActive: true},
    });
    if(!team) {
      return res.status(400).json({error: 'Invalid team code'});
    }
    if(!team.isActive) {
      return res.status(400).json({error: 'Team registration is not active'});
    }

    const existingUser = await prisma.user.findUnique({where: {email}});
    if(existingUser) {
      return res.status(400).json({error: 'User already exists'});
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        teamId: team.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {select: {id: true, name: true, teamCode: true}},
      }
    });
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.status(201).json({
        message: `Successfully joined ${team.name}`,
        user,
        token,
      });
  } catch (err) {
    console.error('Error registering team:', err);
    res.status(500).json({error: 'Registration failed'});
  }
})

app.post('/auth/join-team', async (req, res) => {
  try {
    const {teamCode} = req.body;
    const userId = req.user.id; 

    const team = await prisma.team.findUnique({
      where: {teamCode},
      select: {id: true, name: true, isActive: true},
    });
    if(!team) {
      return res.status(400).json({error: 'Invalid team code'});
    }
    if(!team.isActive) {
      return res.status(400).json({error: 'Team is not active'});
    }

    const user = await prisma.user.update({
      where: {id: userId},
      data: {teamId: team.id},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {select: {id: true, name: true, teamCode: true}},
      }
    });
    res.json({
      message: `Successfully joined ${team.name}`,
      user,
    });
  } catch (err) {
    console.error('Error joining team:', err);
    res.status(500).json({error: 'Failed to join team'});
  }
})

// TEMPORARY: Populate team codes for existing teams
app.post('/admin/populate-team-codes', authenticationToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Get all teams without team codes
    const teamsWithoutCodes = await prisma.team.findMany({
      where: {
        teamCode: null
      }
    });

    console.log(`Found ${teamsWithoutCodes.length} teams without codes`);

    // Generate unique codes for each team
    const updatedTeams = [];
    
    for (const team of teamsWithoutCodes) {
      // Generate a simple team code based on team name
      let teamCode = team.name.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
      
      // Make sure it's unique
      let isUnique = false;
      while (!isUnique) {
        const existingTeam = await prisma.team.findUnique({
          where: { teamCode }
        });
        if (!existingTeam) {
          isUnique = true;
        } else {
          teamCode = team.name.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
        }
      }

      // Update the team with the new code
      const updatedTeam = await prisma.team.update({
        where: { id: team.id },
        data: { teamCode }
      });

      updatedTeams.push(updatedTeam);
      console.log(`Updated team "${team.name}" with code: ${teamCode}`);
    }

    res.json({
      message: `Successfully generated team codes for ${updatedTeams.length} teams`,
      teams: updatedTeams
    });
  } catch (error) {
    console.error('Error populating team codes:', error);
    res.status(500).json({ error: 'Failed to populate team codes' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Express & Socket.io server running on port ${port}`);
});
