const express = require('express'),
  app = express(),
  connectDb = require('./config/connectDB');

//establish DB connection
connectDb();

app.use(express.json({ extended: true }));

app.use('/api/user', require('./routes/api/user'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

app.get('/', (req, res) => res.send(`hi this is API call`));

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
