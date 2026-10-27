import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'localloop_jwt_default_secret_key',
    { expiresIn: '7d' }
  );
};

export default generateToken;
