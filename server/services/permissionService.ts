/**
 * ZAVIO Permission Service
 * 
 * Controls action execution with permission levels, whitelisting,
 * and dry-run simulation capabilities.
 */

// --- Permission Levels ---
export enum PermissionLevel {
    BLOCKED = 0,      // Never execute
    CONFIRM = 1,      // Require explicit user approval
    DRY_RUN = 2,      // Simulate first, confirm execution
    AUTO = 3          // Execute without confirmation (trusted actions only)
}

// --- Action Categories ---
export enum ActionCategory {
    READ = 'READ',           // Data retrieval, queries
    WRITE = 'WRITE',         // Data modification
    EXECUTE = 'EXECUTE',     // System commands
    EXTERNAL = 'EXTERNAL',   // API calls, network requests
    DESTRUCTIVE = 'DESTRUCTIVE' // Delete, overwrite operations
}

// --- Action Definition ---
export interface ActionDefinition {
    id: string;
    name: string;
    category: ActionCategory;
    permissionLevel: PermissionLevel;
    description: string;
    riskFactors: string[];
}

// --- Execution Request ---
export interface ExecutionRequest {
    actionId: string;
    parameters: Record<string, any>;
    sessionId: string;
    isDryRun: boolean;
}

// --- Execution Result ---
export interface ExecutionResult {
    success: boolean;
    actionId: string;
    wasSimulated: boolean;
    output?: any;
    sideEffects: string[];
    rollbackAvailable: boolean;
    error?: string;
}

// --- Action Whitelist Registry ---
const ACTION_REGISTRY: Map<string, ActionDefinition> = new Map([
    // Safe READ actions - AUTO
    ['query_data', {
        id: 'query_data',
        name: 'Query Data',
        category: ActionCategory.READ,
        permissionLevel: PermissionLevel.AUTO,
        description: 'Retrieve information from data sources',
        riskFactors: []
    }],
    ['analyze_content', {
        id: 'analyze_content',
        name: 'Analyze Content',
        category: ActionCategory.READ,
        permissionLevel: PermissionLevel.AUTO,
        description: 'Process and analyze provided content',
        riskFactors: []
    }],

    // WRITE actions - CONFIRM required
    ['create_reminder', {
        id: 'create_reminder',
        name: 'Create Reminder',
        category: ActionCategory.WRITE,
        permissionLevel: PermissionLevel.CONFIRM,
        description: 'Create a new reminder or scheduled task',
        riskFactors: ['Notification scheduling']
    }],
    ['update_preferences', {
        id: 'update_preferences',
        name: 'Update Preferences',
        category: ActionCategory.WRITE,
        permissionLevel: PermissionLevel.CONFIRM,
        description: 'Modify user preferences and settings',
        riskFactors: ['Settings change']
    }],

    // EXECUTE actions - DRY_RUN required
    ['run_script', {
        id: 'run_script',
        name: 'Run Script',
        category: ActionCategory.EXECUTE,
        permissionLevel: PermissionLevel.DRY_RUN,
        description: 'Execute a script or automation',
        riskFactors: ['System modification', 'Irreversible changes possible']
    }],
    ['send_notification', {
        id: 'send_notification',
        name: 'Send Notification',
        category: ActionCategory.EXTERNAL,
        permissionLevel: PermissionLevel.CONFIRM,
        description: 'Send external notification or message',
        riskFactors: ['External communication']
    }],

    // DESTRUCTIVE actions - BLOCKED by default
    ['delete_data', {
        id: 'delete_data',
        name: 'Delete Data',
        category: ActionCategory.DESTRUCTIVE,
        permissionLevel: PermissionLevel.BLOCKED,
        description: 'Permanently remove data',
        riskFactors: ['Data loss', 'Irreversible']
    }],
    ['clear_history', {
        id: 'clear_history',
        name: 'Clear History',
        category: ActionCategory.DESTRUCTIVE,
        permissionLevel: PermissionLevel.CONFIRM,
        description: 'Clear session or decision history',
        riskFactors: ['History loss']
    }]
]);

// --- Permission Checking ---
export const checkPermission = (actionId: string): {
    allowed: boolean;
    level: PermissionLevel;
    requiresConfirmation: boolean;
    requiresDryRun: boolean;
    action?: ActionDefinition;
    reason?: string;
} => {
    const action = ACTION_REGISTRY.get(actionId);

    if (!action) {
        return {
            allowed: false,
            level: PermissionLevel.BLOCKED,
            requiresConfirmation: false,
            requiresDryRun: false,
            reason: `Unknown action: ${actionId}`
        };
    }

    if (action.permissionLevel === PermissionLevel.BLOCKED) {
        return {
            allowed: false,
            level: PermissionLevel.BLOCKED,
            requiresConfirmation: false,
            requiresDryRun: false,
            action,
            reason: 'Action is blocked by security policy'
        };
    }

    return {
        allowed: true,
        level: action.permissionLevel,
        requiresConfirmation: action.permissionLevel >= PermissionLevel.CONFIRM,
        requiresDryRun: action.permissionLevel >= PermissionLevel.DRY_RUN,
        action
    };
};

// --- Dry Run Simulation ---
export const simulateAction = async (request: ExecutionRequest): Promise<ExecutionResult> => {
    const action = ACTION_REGISTRY.get(request.actionId);

    if (!action) {
        return {
            success: false,
            actionId: request.actionId,
            wasSimulated: true,
            sideEffects: [],
            rollbackAvailable: false,
            error: 'Unknown action'
        };
    }

    // Simulate based on category
    const simulatedEffects = simulateEffects(action, request.parameters);

    console.log(`[PERMISSION] Simulated ${request.actionId}:`, simulatedEffects);

    return {
        success: true,
        actionId: request.actionId,
        wasSimulated: true,
        output: { simulated: true, preview: simulatedEffects.preview },
        sideEffects: simulatedEffects.effects,
        rollbackAvailable: simulatedEffects.reversible
    };
};

// --- Effect Simulation ---
const simulateEffects = (action: ActionDefinition, params: Record<string, any>): {
    preview: string;
    effects: string[];
    reversible: boolean;
} => {
    switch (action.category) {
        case ActionCategory.READ:
            return {
                preview: `Would retrieve: ${JSON.stringify(params).substring(0, 50)}...`,
                effects: [],
                reversible: true
            };

        case ActionCategory.WRITE:
            return {
                preview: `Would modify: ${Object.keys(params).join(', ')}`,
                effects: [`Data modification in: ${Object.keys(params).join(', ')}`],
                reversible: true
            };

        case ActionCategory.EXECUTE:
            return {
                preview: `Would execute: ${action.name}`,
                effects: action.riskFactors,
                reversible: false
            };

        case ActionCategory.EXTERNAL:
            return {
                preview: `Would send to external service`,
                effects: ['External API call', ...action.riskFactors],
                reversible: false
            };

        case ActionCategory.DESTRUCTIVE:
            return {
                preview: `Would permanently delete/modify data`,
                effects: ['DATA LOSS', ...action.riskFactors],
                reversible: false
            };

        default:
            return { preview: 'Unknown action type', effects: [], reversible: false };
    }
};

// --- Execute Action (if permitted) ---
export const executeAction = async (request: ExecutionRequest): Promise<ExecutionResult> => {
    const permission = checkPermission(request.actionId);

    if (!permission.allowed) {
        return {
            success: false,
            actionId: request.actionId,
            wasSimulated: false,
            sideEffects: [],
            rollbackAvailable: false,
            error: permission.reason
        };
    }

    // If dry-run required and not a simulation, simulate first
    if (permission.requiresDryRun && !request.isDryRun) {
        return simulateAction(request);
    }

    // Execute the action (placeholder - would connect to actual action handlers)
    console.log(`[PERMISSION] Executing ${request.actionId} with params:`, request.parameters);

    return {
        success: true,
        actionId: request.actionId,
        wasSimulated: false,
        output: { executed: true, timestamp: Date.now() },
        sideEffects: permission.action?.riskFactors || [],
        rollbackAvailable: permission.action?.category === ActionCategory.WRITE
    };
};

// --- Get All Registered Actions ---
export const getActionRegistry = (): ActionDefinition[] => {
    return Array.from(ACTION_REGISTRY.values());
};

// --- Register Custom Action (dynamic) ---
export const registerAction = (action: ActionDefinition): boolean => {
    if (ACTION_REGISTRY.has(action.id)) {
        return false;
    }
    ACTION_REGISTRY.set(action.id, action);
    console.log(`[PERMISSION] Registered new action: ${action.id}`);
    return true;
};
