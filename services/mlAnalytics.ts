/**
 * ML Analytics Service
 * Tracks user patterns, learns preferences, and adapts ZAVIO behavior
 */

interface UserInteraction {
    id: string;
    timestamp: number;
    type: 'query' | 'task' | 'preference' | 'feedback';
    content: string;
    context?: any;
    outcome?: string;
}

interface Pattern {
    id: string;
    type: 'frequent_task' | 'time_pattern' | 'preference' | 'workflow';
    description: string;
    confidence: number;
    occurrences: number;
    lastSeen: number;
}

class MLAnalyticsService {
    private static interactions: UserInteraction[] = [];
    private static patterns: Pattern[] = [];
    private static readonly MAX_HISTORY = 1000;

    /**
     * Log user interaction for pattern learning
     */
    static logInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): void {
        const record: UserInteraction = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...interaction
        };

        this.interactions.push(record);

        // Keep only recent interactions
        if (this.interactions.length > this.MAX_HISTORY) {
            this.interactions = this.interactions.slice(-this.MAX_HISTORY);
        }

        // Trigger pattern detection (debounced)
        this.detectPatterns();

        console.log('[ML Analytics] Logged:', interaction.type, '-', interaction.content.substring(0, 30));
    }

    /**
     * Detect patterns in user behavior
     */
    private static detectPatterns(): void {
        // Frequency analysis
        const taskCounts: Record<string, number> = {};
        const recentTasks = this.interactions.filter(i => i.type === 'task' && Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000);

        recentTasks.forEach(task => {
            const normalized = task.content.toLowerCase().trim();
            taskCounts[normalized] = (taskCounts[normalized] || 0) + 1;
        });

        // Identify frequent tasks
        Object.entries(taskCounts).forEach(([task, count]) => {
            if (count >= 3) {
                this.addOrUpdatePattern({
                    type: 'frequent_task',
                    description: task,
                    confidence: Math.min(count / 10, 1),
                    occurrences: count
                });
            }
        });

        // Time pattern detection
        const hourCounts: number[] = new Array(24).fill(0);
        recentTasks.forEach(task => {
            const hour = new Date(task.timestamp).getHours();
            hourCounts[hour]++;
        });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        if (hourCounts[peakHour] > 5) {
            this.addOrUpdatePattern({
                type: 'time_pattern',
                description: `Most active during hour ${peakHour}:00`,
                confidence: 0.8,
                occurrences: hourCounts[peakHour]
            });
        }
    }

    /**
     * Add or update pattern
     */
    private static addOrUpdatePattern(pattern: Omit<Pattern, 'id' | 'lastSeen'>): void {
        const existing = this.patterns.find(p => p.type === pattern.type && p.description === pattern.description);

        if (existing) {
            existing.confidence = pattern.confidence;
            existing.occurrences = pattern.occurrences;
            existing.lastSeen = Date.now();
        } else {
            this.patterns.push({
                id: crypto.randomUUID(),
                lastSeen: Date.now(),
                ...pattern
            });
        }
    }

    /**
     * Get detected patterns
     */
    static getPatterns(): Pattern[] {
        return this.patterns.filter(p => Date.now() - p.lastSeen < 30 * 24 * 60 * 60 * 1000); // Last 30 days
    }

    /**
     * Get user insights
     */
    static getInsights(): {
        totalInteractions: number;
        averageDaily: number;
        topTasks: string[];
        patterns: Pattern[];
    } {
        const last7Days = this.interactions.filter(i => Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000);

        return {
            totalInteractions: this.interactions.length,
            averageDaily: Math.round(last7Days.length / 7),
            topTasks: this.getTopTasks(5),
            patterns: this.getPatterns()
        };
    }

    /**
     * Get top N tasks
     */
    private static getTopTasks(n: number): string[] {
        const taskCounts: Record<string, number> = {};

        this.interactions
            .filter(i => i.type === 'task')
            .forEach(task => {
                taskCounts[task.content] = (taskCounts[task.content] || 0) + 1;
            });

        return Object.entries(taskCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, n)
            .map(([task]) => task);
    }

    /**
     * Export data for analysis
     */
    static exportData(): { interactions: UserInteraction[]; patterns: Pattern[] } {
        return {
            interactions: this.interactions,
            patterns: this.patterns
        };
    }

    /**
     * Import data (for persistence)
     */
    static importData(data: { interactions: UserInteraction[]; patterns: Pattern[] }): void {
        this.interactions = data.interactions || [];
        this.patterns = data.patterns || [];
    }
}

export default MLAnalyticsService;
