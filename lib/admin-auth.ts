export function isAdminAuthorized(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken && process.env.NODE_ENV !== "production") {
    return true;
  }

  const header = request.headers.get("authorization") || "";
  return Boolean(adminToken) && header === `Bearer ${adminToken}`;
}
