import ApiError from "./ApiError.js";

/**
 * Resolves which company the logged-in user acts for.
 *  - companyAdmin -> Company whose email == user email (same convention as the rest of the codebase)
 *  - employee     -> Employee.companyId
 * Returns { companyId, employeeId|null }
 */
export async function resolveCompanyContext(prisma, user) {
  if (user.role === "companyAdmin") {
    const company = await prisma.company.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (!company) throw new ApiError(404, "no such company found");
    return { companyId: company.id, employeeId: null };
  }
  if (user.role === "employee") {
    const emp = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, companyId: true },
    });
    if (!emp) throw new ApiError(404, "no such employee found");
    return { companyId: emp.companyId, employeeId: emp.id };
  }
  throw new ApiError(403, "not a company user");
}

export async function resolveCollegeId(prisma, user) {
  const college = await prisma.college.findUnique({
    where: { email: user.email },
    select: { id: true, name: true },
  });
  if (!college) throw new ApiError(404, "no such college found");
  return college;
}

/** Bust every cache that shows a job's pipeline (old code used two different key names). */
export async function bustPipelineCache(redis, jobId) {
  await Promise.all([
    redis.incr(`company:job:pipeline:${jobId}:version`),
    redis.incr(`company:job:${jobId}:version`),
    redis.incr(`job:${jobId}:version`),
  ]);
}
