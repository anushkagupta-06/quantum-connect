import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }
  
    const token = authHeader.split(" ")[1];         // separates the actual token
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Attach user ID to request object
      req.user = {
        userId: decoded.userId, 
      };
  
      next();
    } catch (err) {
      console.error("JWT Error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };