const jwt = require('jsonwebtoken'),
  config = require('config');

let authorizeUser = function(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ error: [{ msg: 'nott authorized' }] });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: [{ msg: 'token not valid' }] });
  }
};





module.exports = authorizeUser;
