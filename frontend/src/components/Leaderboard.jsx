import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

const Leaderboard = () => { 
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const { socket, connected } = useSocket();

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('http://localhost:4243/leaderboard');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && Array.isArray(data)) {
                setTeams(data);
            } else {
                setTeams([]);
            }
            
            setLoading(false);
            
        } catch (error) {
            setTeams([]);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(); 
    }, []);
    
    
    useEffect(() => {
        if (!socket) {
            return;
        }

        console.log('Setting up socket listeners');

        const handleLeaderboardUpdate = (data) => {
            
            if (data && Array.isArray(data)) {
                console.log('✅ Using socket data directly');
                setTeams(data);
                setLastUpdated(new Date());
            } else {
                console.log('⚠️ Socket data invalid, refetching');
                fetchLeaderboard();
            }
        };

        const leaderUpdateHandler = (eventName, data) => {
            fetchLeaderboard();
        };

        socket.on('leaderboard-update', handleLeaderboardUpdate);
        socket.on('new-donation', (data) => leaderUpdateHandler('new-donation', data));
        socket.on('photo-approved', (data) => leaderUpdateHandler('photo-approved', data));

        return () => {
            socket.off('leaderboard-update');
            socket.off('new-donation');
            socket.off('photo-approved');
        };
    }, [socket]);

    if (loading) {
        return (  
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl"> 
            {/* Header Section */}
            <div className="text-center mb-8">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
                    Project Phi Leaderboard
                </h1>
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
                    <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{connected ? 'Live Updates' : 'Disconnected'}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">({teams.length} teams)</span>
                </div>
            </div>
            
            {/* Leaderboard */}
            <div className="space-y-4">
                {teams.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No Teams Found...Event not ready</p>
                        <p className="text-xs text-gray-400 mt-2">Check console for debug info</p>
                    </div>  
                ) : (
                    teams.map((team, index) => {
                        return (
                            <LeaderboardItem
                                key={team.id}
                                team={team}
                                rank={index + 1}
                                isTop3={index < 3}
                            />
                        );
                    })
                )}
            </div>
        </div>
    ); 
}; 

const LeaderboardItem = ({ team, rank, isTop3 }) => {
    const getRankBadge = (rank) => {
        const badges = {
            1: { emoji: '🥇', color: 'from-yellow-400 to-yellow-600' },
            2: { emoji: '🥈', color: 'from-gray-300 to-gray-500' },
            3: { emoji: '🥉', color: 'from-amber-600 to-amber-800' }
        };
        return badges[rank] || { emoji: rank, color: 'from-blue-500 to-blue-700' };
    };

    const badge = getRankBadge(rank);

    return (
        <div className={`
            p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105
            ${isTop3 
                ? `bg-gradient-to-r ${badge.color} text-white` 
                : 'bg-white border-2 border-gray-200'
            }
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <div className={`
                        text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center
                        ${isTop3 ? 'bg-white bg-opacity-20' : 'bg-blue-600 text-white'}
                    `}>
                        {badge.emoji}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{team.name}</h3>
                        <div className="text-sm opacity-90">
                            💰 ${team.totalDonations?.toFixed(2) || '0.00'} | 
                            📸 {team.photoCount || 0} photos | 
                            👥 {team.memberCount || 0} members
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold">{team.totalScore || 0}</div>
                    <div className="text-sm opacity-90">points</div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;