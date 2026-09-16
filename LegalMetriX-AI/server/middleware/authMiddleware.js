import jwt from "jsonwebtoken";

export function optionalAuth(
  req,
  res,
  next
) {
  const header =
    req.headers.authorization;

  if (
    !header?.startsWith(
      "Bearer "
    )
  ) {
    return next();
  }

  try {
    req.user =
      jwt.verify(
        header.slice(7),
        process.env.JWT_SECRET
      );
  } catch {}

  next();
}

export function requireAuth(
  req,
  res,
  next
) {
  const header =
    req.headers.authorization;

  if (
    !header?.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required."
    });
  }

  try {
    req.user =
      jwt.verify(
        header.slice(7),
        process.env.JWT_SECRET
      );

    next();
  } catch {
    res.status(401).json({
      success: false,
      message:
        "Invalid or expired token."
    });
  }
}

export function allowRoles(
  ...roles
) {
  return (
    req,
    res,
    next
  ) => {
    if (
      !req.user ||
      !roles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Insufficient permissions."
      });
    }

    next();
  };
}