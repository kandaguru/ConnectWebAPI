const express = require('express'),
  router = express.Router({ mergeParams: true }),
  authorizeUser = require('../../middleware'),
  { check, validationResult } = require('express-validator'),
  Post = require('../../models/Post');

//@route  POST api/posts
//@desc   create a new post
//@access Private
router.post(
  '/',
  [
    authorizeUser,
    [
      check('text', 'text is mandatory')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
      }

      const { text } = req.body;

      console.log(req.user);

      const newPost = new Post({
        user: req.user.id,
        text,
        name: req.user.name,
        avatar: req.user.avatar
      });

      newPost.save();
      res.json(newPost);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('sever error');
    }
  }
);

//@route  get api/posts
//@desc   get all post
//@access Private
router.get('/', authorizeUser, async (req, res) => {
  try {
    let allPosts = await Post.find({})
      .populate('user', ['name', 'avatar', 'email'])
      .sort({ date: -1 });
    if (!allPosts) return res.status(404).json({ msg: 'No Posts' });
    res.json(allPosts);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//@route  get api/posts/:post_id
//@desc   get specific post
//@access Private
router.get('/:post_id', authorizeUser, async (req, res) => {
  try {
    let foundPost = await Post.findById(req.params.post_id);
    if (!foundPost) return res.status(404).json({ msg: 'No such Post' });
    res.json(foundPost);
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId')
      return res.status(400).json({ msg: 'No such Post' });
    res.status(500).send('server error');
  }
});

router.delete('/:post_id', authorizeUser, async (req, res) => {
  try {
    let deletedPost = await Post.findByIdAndRemove(req.params.post_id);
    if (!deletedPost) return res.status(404).json({ msg: 'not found' });
    //check post ownership
    if (deletedPost.user.equals(req.user.id))
      return res.status(401).json({ msg: 'not authorized' });
    res.json({ msg: 'post Deleted' });
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId')
      return res.status(400).json({ msg: 'No such Post' });
    res.status(500).send('server error');
  }
});

module.exports = router;
