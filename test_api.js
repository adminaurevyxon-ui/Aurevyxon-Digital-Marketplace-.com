import jwt from 'jsonwebtoken';
const t = jwt.sign({ id: 'user_123', role: 'seller' }, 'super_secret_omniverse_key');
console.log(t);
