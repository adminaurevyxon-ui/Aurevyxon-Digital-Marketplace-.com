const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '01KXPV3H83Z1A21X0Y1EWB1414', name: 'Admin', email: 'admin@omniverse.com' }, 'super_secret_omniverse_key');
console.log(token);
