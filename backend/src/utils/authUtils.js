import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Read these lazily (inside the functions) so the values are taken AFTER
// dotenv.config() has run. Reading them at module load can capture undefined
// because route imports are evaluated before dotenv.config() in server.js.
const getSecret = () => process.env.JWT_SECRET || "development_secret";
const getExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (
  password,
  hashedPassword
) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Create JWT token
export const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),

      role: user.role,

      gymId: user.gymId
        ? user.gymId.toString()
        : null,
    },
    getSecret(),
    {
      expiresIn: getExpiresIn(),
    }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};