const express = require('express'),
  router = express.Router({ mergeParams: true }),
  authorizeUser = require('../../middleware'),
  config = require('config'),
  User = require('../../models/User'),
  { check, validationResult } = require('express-validator'),
  bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken');

//@route  GET api/auth
//@desc   get user data
//@access Public
router.get('/', authorizeUser, async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.user.id }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//@route  POST api/auth
//@desc    Login route
//@access Public
router.post(
  '/',
  [
    check('email', 'enter a valid email').isEmail(),
    check('password', 'password must contain atleast 6 characters').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const { errors } = validationResult(req);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { email, password } = req.body;

    try {
      let foundUser = await User.findOne({ email });
      if (!foundUser) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Creds' }] });
      }

      //compare password text with the salt
      const isMatch = await bcrypt.compare(password, foundUser.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Creds' }] });
      }

      const payload = {
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          date: foundUser.date,
          avatar: foundUser.avatar
        }
      };

      await jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) {
            return res.json({ error: [{ msg: err.message }] });
          }
          return res.status(200).json({ token });
        }
      );
    } catch (err) {
      res.json({ error: [{ msg: err.message }] });
    }
  }
);

module.exports = router;
