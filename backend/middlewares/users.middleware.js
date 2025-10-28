// backend/middlewares/users.middleware.js
const jwt = require("jsonwebtoken");
const { blacklist } = require("../blacklist");

const ACCESS_SECRET = process.env.JWT_SECRET || "arivu"; // keep in sync with users.routes

// WHY: predictable shape for downstream handlers
function toSafeUser(decoded) {
  return {
    id: decoded?.userId || decoded?.id || null,
    name: decoded?.user || decoded?.name || null,
    role: String(decoded?.role || "").toUpperCase(),
  };
}

const auth = (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (!token) {
      return res.status(401).json({ msg: "Please login" });
    }

    if (blacklist.includes(token)) {
      return res.status(401).json({ msg: "Please login again" });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);
    const user = toSafeUser(decoded);

    if (!user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Attach both styles for backward compatibility
    req.user = user; // preferred
    req.body.userId = user.id; // legacy consumers
    req.body.username = user.name;
    req.body.role = user.role;

    return next();
  } catch (error) {
    // Token expired, malformed, or secret mismatch
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

// Optional role guard (use in routes when needed)
const requires =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: "Please login" });
    const r = String(req.user.role || "").toUpperCase();
    if (roles.length && !roles.includes(r)) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    return next();
  };

module.exports = {
  auth,
  requires,
};
