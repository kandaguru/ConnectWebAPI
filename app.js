const express = require('express'),
  app = express();

const PORT = process.env.PORT || 5500;

app.get('/', (req, res) => res.send(`hi this is API call`));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
