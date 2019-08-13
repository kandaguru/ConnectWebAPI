const express = require('express'),
  router = express.Router({ mergeParams: true }),
  { check, validationResult } = require('express-validator'),
  gravatar = require('gravatar'),
  bcrypt = require('bcryptjs'),
  User = require('../../models/User'),
  jwt = require('jsonwebtoken'),
  config = require('config');

//@route  POST api/users
//@desc   register user
//@access Public
router.post(
  '/',
  //passsing express-validators as middleware
  [
    check('name', 'name is required')
      .not()
      .isEmpty(),
    check('email', 'email is required').isEmail(),
    check('password', 'Password Must be atleast 6 characters long').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    try {
      const { errors } = validationResult(req);

      if (errors.length > 0) {
        console.log(errors);
        return res.status(400).json({ errors });
      }

      const { email, name, password } = req.body;

      //find existing users
      let foundUser = await User.findOne({ email });
      if (foundUser) {
        return res
          .status(500)
          .json({ error: [{ msg: `user already exists` }] });
      }

      //get gravatar
      let profileImg = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      //encrypt password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      //create new user
      let newUser = new User({
        name,
        email,
        avatar: profileImg,
        password: hash
      });

      let savedUser = await newUser.save();

      //return json resp
      const payload = {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          date: savedUser.date
        }
      };

      await jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000
        },
        (err, token) => {
          if (err) {
            return res.json({ error: [{ msg: err.message }] });
          }
          return res.status(500).json({ token });
        }
      );
    } catch (err) {
      res.status(500).json({ error: [{ msg: err.message }] });
    }
  }
);

module.exports = router;
