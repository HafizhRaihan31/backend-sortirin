const adminMiddleware = (
  req,
  res,
  next
) => {

  // CHECK ROLE
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Akses ditolak, admin only",
    });
  }

  next();
};

module.exports =
  adminMiddleware;