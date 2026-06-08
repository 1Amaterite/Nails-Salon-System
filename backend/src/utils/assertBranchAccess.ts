import { Response } from 'express';

/**
 * Guards a controller action by checking that a non-OWNER caller is only
 * operating on their own branch. Returns `true` if access is allowed,
 * or sends a 403 response and returns `false` so the controller can
 * return early.
 *
 * OWNERs pass through unconditionally (they have cross-branch access).
 *
 * Usage:
 *   if (!assertBranchAccess(res, role, callerBranchId, branchId)) return;
 */
export function assertBranchAccess(
    res: Response,
    callerRole: string,
    callerBranchId: string,
    targetBranchId: string
): boolean {
    if (callerRole !== 'OWNER' && targetBranchId !== callerBranchId) {
        res.status(403).json({
            error: 'Access denied. You can only manage resources within your own branch.',
        });
        return false;
    }
    return true;
}
