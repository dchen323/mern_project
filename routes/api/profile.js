import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
const router = express.Router();

//Load validations
import validateProfileInput from '../../validation/profile';

//Load profile and user model
import Profile from '../../models/Profile';
import User from '../../models/User';

// @route GET api/profile/test
//@desc Tests posts route
//@access public route
router.get('/test', (req, res) => res.json({msg: "Profile Works"}));

// @route GET api/profile
//@desc Get current users profile
//@access private route
router.get('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});
// @route POST api/handle/:handle
//@desc Get profile by handle
//@access public route
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile){
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route POST api/profile/user/:user_id
//@desc Get profile by user ID
//@access public route
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile){
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for this user'}));
});

// @route POST api/profile
//@desc Create/edit user profile
//@access private route
router.post('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  //Get fields
  const { errors, isValid } = validateProfileInput(req.body);

  //Check validation
  if(!isValid) {
    //Return errors with 400 error
    return res.status(400).json(errors);
  }
  const profileFields = {};
  profileFields.user = req.user.id;
  if(req.body.handle) profileFields.handle = req.body.handle;
  if(req.body.company) profileFields.company = req.body.company;
  if(req.body.website) profileFields.website = req.body.website;
  if(req.body.location) profileFields.location = req.body.location;
  if(req.body.status) profileFields.status = req.body.status;
  if(req.body.bio) profileFields.bio = req.body.bio;
  if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;
  //Skill - Split into array
  if(typeof req.body.skills !== 'undefined'){
    profileFields.skills = req.body.skills.split(',');
  }
  //Social
  profileFields.social = {};
  if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      if(profile){
        //update
        Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true})
          .then(profile => res.json(profile));
      }else {
        //create
        //Check if handle exists
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if(profile){
              errors.handle = 'That handle already exists';
              res.status(400).json(errors);
            }

            new Profile(profileFields)
              .save()
              .then(profile => res.json(profile));
          });
      }
    });

});


export default router;
