/**
 * Restrict a route to one or more roles. Must run after `protect`.
 *
 *   router.post("/", protect, authorize("admin"), createClass);
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error("Not authorized"));
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(
      new Error(`Access denied: this action requires role [${roles.join(", ")}]`)
    );
  }
  next();
};

module.exports = { authorize };
