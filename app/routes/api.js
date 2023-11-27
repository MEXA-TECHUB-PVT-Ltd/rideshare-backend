const express = require('express');
const router = express.Router();
// project files directories
const users = require('./users/users');
const vehicles_details = require('./vehicles_details/vehicles_details');

router.use('/users', users);
router.use('/vehicles_details', vehicles_details);

module.exports = router;
