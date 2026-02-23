/**
 * Material Math Utility
 * Central logic for unit conversions in construction materials
 */

// Steel conversion constants (based on standard TMT bar specifications)
const STEEL_WEIGHT_PER_METER: Record<number, number> = {
    8: 0.395,   // 8mm diameter = 0.395 kg/m
    10: 0.617,  // 10mm diameter = 0.617 kg/m
    12: 0.888,  // 12mm diameter = 0.888 kg/m
    16: 1.578,  // 16mm diameter = 1.578 kg/m
    20: 2.469,  // 20mm diameter = 2.469 kg/m
    25: 3.854,  // 25mm diameter = 3.854 kg/m
    32: 6.313,  // 32mm diameter = 6.313 kg/m
};

const STANDARD_ROD_LENGTH = 12; // meters

// Sand conversion constants
const CUBIC_FEET_PER_TRUCK_LOAD = 100; // Standard truck capacity
const CUBIC_FEET_PER_TON_SAND = 35.3147; // Approximate

// Brick conversion constants
const BRICKS_PER_PALLET = 500; // Standard pallet size

// Cement conversion constants
const BAGS_PER_TON = 20; // 50kg bags

export interface SteelConversion {
    tons: number;
    kilograms: number;
    rods: number;
    diameter: number;
}

export interface SandConversion {
    tons: number;
    cubicFeet: number;
    truckLoads: number;
}

export interface BrickConversion {
    pieces: number;
    pallets: number;
}

export interface CementConversion {
    tons: number;
    bags: number;
}

/**
 * Convert steel between different units
 */
export const convertSteel = {
    /**
     * Convert tons to rods based on diameter
     */
    tonsToRods: (tons: number, diameter: number): number => {
        const weightPerMeter = STEEL_WEIGHT_PER_METER[diameter];
        if (!weightPerMeter) {
            throw new Error(`Invalid diameter: ${diameter}mm. Supported: 8, 10, 12, 16, 20, 25, 32`);
        }
        const totalKg = tons * 1000;
        const weightPerRod = weightPerMeter * STANDARD_ROD_LENGTH;
        return Math.floor(totalKg / weightPerRod);
    },

    /**
     * Convert rods to tons based on diameter
     */
    rodsToTons: (rods: number, diameter: number): number => {
        const weightPerMeter = STEEL_WEIGHT_PER_METER[diameter];
        if (!weightPerMeter) {
            throw new Error(`Invalid diameter: ${diameter}mm. Supported: 8, 10, 12, 16, 20, 25, 32`);
        }
        const weightPerRod = weightPerMeter * STANDARD_ROD_LENGTH;
        const totalKg = rods * weightPerRod;
        return totalKg / 1000;
    },

    /**
     * Convert kilograms to rods based on diameter
     */
    kgToRods: (kg: number, diameter: number): number => {
        return convertSteel.tonsToRods(kg / 1000, diameter);
    },

    /**
     * Get all conversions for a given quantity
     */
    getAllConversions: (quantity: number, unit: 'tons' | 'kg' | 'rods', diameter: number): SteelConversion => {
        let tons: number;
        let kilograms: number;
        let rods: number;

        if (unit === 'tons') {
            tons = quantity;
            kilograms = tons * 1000;
            rods = convertSteel.tonsToRods(tons, diameter);
        } else if (unit === 'kg') {
            kilograms = quantity;
            tons = kilograms / 1000;
            rods = convertSteel.kgToRods(kilograms, diameter);
        } else {
            rods = quantity;
            tons = convertSteel.rodsToTons(rods, diameter);
            kilograms = tons * 1000;
        }

        return { tons, kilograms, rods, diameter };
    }
};

/**
 * Convert sand between different units
 */
export const convertSand = {
    /**
     * Convert tons to cubic feet
     */
    tonsToCubicFeet: (tons: number): number => {
        return tons * CUBIC_FEET_PER_TON_SAND;
    },

    /**
     * Convert cubic feet to tons
     */
    cubicFeetToTons: (cubicFeet: number): number => {
        return cubicFeet / CUBIC_FEET_PER_TON_SAND;
    },

    /**
     * Convert truck loads to cubic feet
     */
    truckLoadsToCubicFeet: (truckLoads: number): number => {
        return truckLoads * CUBIC_FEET_PER_TRUCK_LOAD;
    },

    /**
     * Convert cubic feet to truck loads
     */
    cubicFeetToTruckLoads: (cubicFeet: number): number => {
        return cubicFeet / CUBIC_FEET_PER_TRUCK_LOAD;
    },

    /**
     * Get all conversions for a given quantity
     */
    getAllConversions: (quantity: number, unit: 'tons' | 'cubicFeet' | 'truckLoads'): SandConversion => {
        let tons: number;
        let cubicFeet: number;
        let truckLoads: number;

        if (unit === 'tons') {
            tons = quantity;
            cubicFeet = convertSand.tonsToCubicFeet(tons);
            truckLoads = convertSand.cubicFeetToTruckLoads(cubicFeet);
        } else if (unit === 'cubicFeet') {
            cubicFeet = quantity;
            tons = convertSand.cubicFeetToTons(cubicFeet);
            truckLoads = convertSand.cubicFeetToTruckLoads(cubicFeet);
        } else {
            truckLoads = quantity;
            cubicFeet = convertSand.truckLoadsToCubicFeet(truckLoads);
            tons = convertSand.cubicFeetToTons(cubicFeet);
        }

        return { tons, cubicFeet, truckLoads };
    }
};

/**
 * Convert bricks between different units
 */
export const convertBricks = {
    /**
     * Convert pieces to pallets
     */
    piecesToPallets: (pieces: number): number => {
        return pieces / BRICKS_PER_PALLET;
    },

    /**
     * Convert pallets to pieces
     */
    palletsToPieces: (pallets: number): number => {
        return pallets * BRICKS_PER_PALLET;
    },

    /**
     * Get all conversions for a given quantity
     */
    getAllConversions: (quantity: number, unit: 'pieces' | 'pallets'): BrickConversion => {
        let pieces: number;
        let pallets: number;

        if (unit === 'pieces') {
            pieces = quantity;
            pallets = convertBricks.piecesToPallets(pieces);
        } else {
            pallets = quantity;
            pieces = convertBricks.palletsToPieces(pallets);
        }

        return { pieces, pallets };
    }
};

/**
 * Convert cement between different units
 */
export const convertCement = {
    /**
     * Convert tons to bags (50kg bags)
     */
    tonsToBags: (tons: number): number => {
        return tons * BAGS_PER_TON;
    },

    /**
     * Convert bags to tons
     */
    bagsToTons: (bags: number): number => {
        return bags / BAGS_PER_TON;
    },

    /**
     * Get all conversions for a given quantity
     */
    getAllConversions: (quantity: number, unit: 'tons' | 'bags'): CementConversion => {
        let tons: number;
        let bags: number;

        if (unit === 'tons') {
            tons = quantity;
            bags = convertCement.tonsToBags(tons);
        } else {
            bags = quantity;
            tons = convertCement.bagsToTons(bags);
        }

        return { tons, bags };
    }
};

/**
 * Calculate price based on quantity and unit price
 */
export const calculatePrice = (
    quantity: number,
    pricePerUnit: number,
    bulkPrice?: number,
    bulkThreshold: number = 50
): number => {
    if (bulkPrice && quantity >= bulkThreshold) {
        return quantity * bulkPrice;
    }
    return quantity * pricePerUnit;
};

/**
 * Format number to 2 decimal places
 */
export const formatNumber = (num: number): string => {
    return num.toFixed(2);
};

/**
 * Format currency (Indian Rupees)
 */
export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
