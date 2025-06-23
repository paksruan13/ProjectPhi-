import React, { useState, useEffect } from 'react';
import {Link, useParams, useNavigate} from 'react-router-dom';

const CoachDashboard = () => {
    const { teamId } = useParams();
    const [teamData, setTeamData] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentTeamId = teamId || "a30192f5-2cd2-45e5-8b6c-3931696e3c17";
        
        const fetchTeamData = async () => {
            try {
                const leaderboardRes = await fetch(`http://localhost:4243/leaderboard`);
                const leaderboardData = await leaderboardRes.json();
                const currentTeam = leaderboardData.find(team => team.id === currentTeamId);
                setTeamData(currentTeam);

                const memberRes = await fetch(`http://localhost:4243/teams/${currentTeamId}/members`);
                const memberData = await memberRes.json();
                setTeamMembers(memberData);

            }   catch (error) {
                console.error('Error fetching team data:', error);
            }   finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    },    [teamId]);

    if (loading) {
        return <div className= "text-center p-10">Loading Coach Dashboard...</div>;
    }
    if (!teamData) {
        return <div className="text-center p-10">Team data not found.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
          {/* Header Navigation */}
          <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-800">TeamFund</div>
                <div className="flex items-center space-x-6">
                  <Link to="/home" className="text-gray-600 hover:text-blue-600">Home</Link>
                  <Link to="/donate" className="text-gray-600 hover:text-blue-600">Donate</Link>
                  <Link to="/activity" className="text-gray-600 hover:text-blue-600">Activity</Link>
                  <Link to={`/dashboard/${teamData.id}`} className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">Dashboard</Link>
                </div>
              </div>
            </nav>
          </header>
    
          {/* Main Dashboard Content */}
          <main className="container mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Team Members */}
              <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Team Members ({teamMembers.length})</h2>
                <ul className="space-y-4 max-h-96 overflow-y-auto">
                  {teamMembers.length > 0 ? teamMembers.map(member => (
                    <li key={member.id} className="border-b border-gray-200 pb-2">
                      <p className="font-semibold text-gray-700">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </li>
                  )) : (
                    <p className="text-gray-500">No members found.</p>
                  )}
                </ul>
              </div>
    
              {/* Right Column: Team Stats and Photo Approval */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Team Information Box */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Team: {teamData.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">ID: {teamData.id}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-lg font-semibold text-blue-600">{teamData.memberCount}</p>
                        <p className="text-gray-600">Members</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-blue-600">{teamData.totalScore}</p>
                        <p className="text-gray-600">Total Points</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-green-600">${teamData.totalDonations.toFixed(2)}</p>
                        <p className="text-gray-600">Donations Raised</p>
                    </div>
                     <div>
                        <p className="text-lg font-semibold text-yellow-600">{teamData.donationCount}</p>
                        <p className="text-gray-600">Number of Donations</p>
                    </div>
                  </div>
                </div>
    
                {/* Photo Approval Section */}
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Photo Approval</h2>
                  <p className="text-gray-600 mb-4">
                    Review photos submitted by your team members.
                  </p>
                  <Link to="/photo-approval" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                    Manage Photos
                  </Link>
                </div>
              </div>
    
            </div>
          </main>
        </div>
      );
    };
    
    export default CoachDashboard;