const express = require('express'),
  router = express.Router({ mergeParams: true }),
  authorizeUser = require('../../middleware'),
  Profile = require('../../models/Profile');
(User = require('../../models/User')),
  ({ check, validationResult } = require('express-validator')),
  (config = require('config')),
  (request = require('request'));

//@route  GET api/profile/me
//@desc   get current user profile
//@access Private
router.get('/me', authorizeUser, async (req, res) => {
  try {
    let foundProfile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'email', 'date']
    );

    if (!foundProfile) {
      return res.json({ errors: [{ msg: 'No such Profile' }] });
    }
    res.json(foundProfile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server Error');
  }
});

//@route  POST api/profile/
//@desc   create user profile
//@access Private
router.post(
  '/',
  [
    authorizeUser,
    [
      check('status', 'status is mandatory')
        .not()
        .isEmpty(),
      check('skills', 'skills is mandatory')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const { errors } = validationResult(req);
    if (errors.length > 0) {
      return res.json({ errors });
    }

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubUsername,
      youtube,
      facebook,
      twitter,
      linkedIn,
      instagram
    } = req.body;

    //
    const profileFields = {};

    //assigning the current user id
    profileFields.user = req.user.id;

    //optional profile fields
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (githubUsername) profileFields.githubUsername = githubUsername;

    //mandatory fields
    //removing spaces if any
    profileFields.skills = skills.split(',').map(it => it.trim());
    profileFields.status = status;

    //social links
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;
    if (instagram) profileFields.social.instagram = instagram;

    try {


    //search for the profile and update if found        
      let foundProfile = await Profile.findOne({ user: req.user.id });
      if (foundProfile) {
        let updatedProfile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(updatedProfile);
      }

      //else create a new profile
      let newProfile = await Profile.create(profileFields);
      res.json(newProfile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
  }
);

//@route  GET /api/profile/
//@desc   get all user profiles
//@access Private
router.get('/', authorizeUser, async (req, res) => {
  try {
    let allProfiles = await Profile.find({}).populate('user', [
      'name',
      'avatar',
      'email'
    ]);
    res.json(allProfiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//@route  GET /api/profile/user/:userId
//@desc   get profile by userId
//@access Private
router.get('/user/:user_id', authorizeUser, async (req, res) => {
  try {
    let foundProfile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['avatar', 'email', 'name']);

    if (!foundProfile) return res.status(400).json({ msg: 'user not found' });
    res.json(foundProfile);
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId')
      return res.status(400).json({ msg: 'user not found' });
    res.status(500).send('server error');
  }
});

//@route  DELETE /api/profile/
//@desc   DEL profile by userId(logged in profile)
//@access Private
router.delete('/', authorizeUser, async (req, res) => {
  try {
    //@todo : remove posts of that user

    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //remove user
    await User.findByIdAndRemove(req.user.id);

    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//@route  PUT /api/profile/experience
//@desc   add profile experience to logged in user
//@access Private
router.put(
  '/experience',
  [
    authorizeUser,
    [
      check('title', 'title is required')
        .not()
        .isEmpty(),
      check('company', 'company is required')
        .not()
        .isEmpty(),
      check('from', 'from date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //destructuring the req body
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      //find the profile to add the experience
      let foundProfile = await Profile.findOne({ user: req.user.id });
      if (!foundProfile) {
        return res.status(400).json({ msg: 'profile not found' });
      }

      //similar to push but add items to top of the array
      foundProfile.experience.unshift(newExp);
      await foundProfile.save();
      res.json(foundProfile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
  }
);

//@route  DELETE /api/profile/experience/
//@desc   add profile experience to logged in user
//@access Private
router.delete('/experience/:exp_id', authorizeUser, async (req, res) => {
  try {
    let foundProfile = await Profile.findOne({ user: req.user.id });

    if (!foundProfile) {
      return res.status(400).json({ msg: 'profile not found' });
    }

    const rmIndex = foundProfile.experience
      .map(it => it.id)
      .indexOf(req.params.exp_id);

    if (rmIndex > -1) foundProfile.experience.splice(rmIndex, 1);
    await foundProfile.save();

    res.json(foundProfile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//@route  PUT /api/profile/education
//@desc   add profile education to logged in user
//@access Private
router.put(
  '/education',
  [
    authorizeUser,
    [
      check('school', 'school is required')
        .not()
        .isEmpty(),
      check('degree', 'degree is required')
        .not()
        .isEmpty(),
      check('from', 'from date is required')
        .not()
        .isEmpty(),
      check('fieldOfStudy', 'fieldOfStudy  is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //destructuring the req body
    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    };

    try {
      //find the profile to add the education
      let foundProfile = await Profile.findOne({ user: req.user.id });
      if (!foundProfile) {
        return res.status(400).json({ msg: 'profile not found' });
      }

      //similar to push but add items to top of the array
      foundProfile.education.unshift(newEdu);
      await foundProfile.save();
      res.json(foundProfile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
  }
);

//@route  DELETE /api/profile/education/edu_id
//@desc   del profile education to logged in user
//@access Private
router.delete('/education/:edu_id', authorizeUser, async (req, res) => {
  try {
    let foundProfile = await Profile.findOne({ user: req.user.id });

    if (!foundProfile) {
      return res.status(400).json({ msg: 'profile not found' });
    }

    const rmIndex = foundProfile.education
      .map(it => it.id)
      .indexOf(req.params.edu_id);

    if (rmIndex > -1) foundProfile.education.splice(rmIndex, 1);
    await foundProfile.save();

    res.json(foundProfile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//@route  GET api/profile/github/:username
//@desc   get github repos
//@access Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'clientId'
      )}&client_secret=${config.get('clientSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (err, resp, body) => {
      if (err) console.log(err);
      if (resp.statusCode !== 200)
        return res.status(404).json({ msg: 'No profile found' });

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

module.exports = router;
