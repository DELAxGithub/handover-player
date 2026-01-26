import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const PresenceAvatars = ({ projectId }) => {
    const [users, setUsers] = useState([]);
    const myName = localStorage.getItem('handover_username') || 'Unknown';

    useEffect(() => {
        if (!projectId) return;

        // Generate a random ID for this session/tab to distinguish multiple tabs of same user
        const sessionId = Math.random().toString(36).substr(2, 9);

        const channel = supabase.channel(`presence:${projectId}`, {
            config: {
                presence: {
                    key: sessionId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                console.log('Presence sync', newState);

                // Flatten state into a list of users
                // presenceState is { key: [payload], ... }
                // We need to track the payload we sent.
                // Wait, we need to send name in track payload.

                const allUsers = [];
                for (const key in newState) {
                    const presence = newState[key];
                    if (presence && presence.length > 0) {
                        // Use the latest status for this key
                        allUsers.push(presence[0]);
                    }
                }
                setUsers(allUsers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_name: myName,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [projectId, myName]);

    return (
        <div className="flex items-center -space-x-2 overflow-hidden py-1 px-2">
            {users.map((u, i) => {
                const name = u.user_name || '?';
                const initial = name.charAt(0).toUpperCase();
                const color = stringToColor(name);

                return (
                    <div
                        key={i}
                        className="relative inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-background text-[10px] font-bold text-white shadow-sm cursor-help transition-transform hover:scale-110 hover:z-10 bg-muted"
                        style={{ backgroundColor: color }}
                        title={`${name} (viewing now)`}
                    >
                        {initial}
                        {/* Online Indicator dot */}
                        <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full ring-1 ring-background bg-success"></span>
                    </div>
                );
            })}
            {users.length === 0 && (
                // Fallback if just me trying to connect or empty
                <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] text-muted-foreground">
                    1
                </div>
            )}
            {users.length > 0 && (
                <div className="ml-3 text-[10px] text-muted-foreground font-medium">
                    {users.length} active
                </div>
            )}
        </div>
    );
};

export default PresenceAvatars;
