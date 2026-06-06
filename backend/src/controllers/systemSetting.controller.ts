import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

/**
 * Retrieves the loyalty earn percentage system setting.
 * Default is 5 if not found.
 */
export async function getLoyaltyEarnPercentage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'loyaltyEarnPercentage' },
        });

        const percentage = setting ? parseInt(setting.value, 10) : 5;
        res.json({ loyaltyEarnPercentage: percentage });
    } catch (error) {
        next(error);
    }
}

/**
 * Updates the loyalty earn percentage system setting.
 * Restricted to OWNER role (handled by middleware check).
 */
export async function updateLoyaltyEarnPercentage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { percentage } = req.body;

    if (percentage === undefined || typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        res.status(400).json({ error: 'Earning percentage must be a number between 0 and 100.' });
        return;
    }

    try {
        const updatedSetting = await prisma.systemSetting.upsert({
            where: { key: 'loyaltyEarnPercentage' },
            update: { value: Math.floor(percentage).toString() },
            create: {
                key: 'loyaltyEarnPercentage',
                value: Math.floor(percentage).toString(),
            },
        });

        res.json({
            message: 'Loyalty earn percentage updated successfully.',
            loyaltyEarnPercentage: parseInt(updatedSetting.value, 10),
        });
    } catch (error) {
        next(error);
    }
}
