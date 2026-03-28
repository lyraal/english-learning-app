import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * 取得當前用戶的 organizationId
 * 用於多租戶隔離查詢
 */
export async function getOrganizationId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).organizationId || null;
}

/**
 * 產生 organizationId 過濾條件
 * 如果有 orgId 就加入過濾，沒有就不過濾（全局用戶）
 */
export function orgFilter(orgId: string | null): Record<string, any> {
  if (!orgId) return {};
  return { organizationId: orgId };
}

/**
 * 為 Prisma where 條件加入 organizationId 過濾
 * 支援有組織和無組織（全局）兩種情況：
 * - 有 orgId：只看該組織的資料 + 全局資料（organizationId = null）
 * - 無 orgId（ADMIN）：看所有資料
 */
export function withOrgFilter(
  where: Record<string, any>,
  orgId: string | null,
  includeGlobal = true
): Record<string, any> {
  if (!orgId) return where; // ADMIN 或全局用戶，不過濾

  if (includeGlobal) {
    return {
      ...where,
      OR: [
        { organizationId: orgId },
        { organizationId: null },
      ],
    };
  }

  return {
    ...where,
    organizationId: orgId,
  };
}
