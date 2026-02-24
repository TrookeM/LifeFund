'use client';

import { useState, useEffect } from 'react';
import GoalsPanel from './GoalsPanel';

export default function GoalsSection() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        // Listen to the global event dispatched by the FloatingAIChat
        const handleGlobalRefresh = () => handleRefresh();
        window.addEventListener('goal-created', handleGlobalRefresh);
        return () => window.removeEventListener('goal-created', handleGlobalRefresh);
    }, []);

    return (
        <div className="mt-8">
            <GoalsPanel key={`panel-${refreshKey}`} />
        </div>
    );
}
