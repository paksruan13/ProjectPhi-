import { useEffect, useState } from "react";

const Donate = () => {
    const [teams, setTeams] = useState([]);
    const [teamId, setTeamId] = useState("");
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

  useEffect(() => {
    // Fetch teams for dropdown
    fetch("http://localhost:4243/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));
    } ), []

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

    try {
        const userRes = await fetch("http://localhost:4243/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName, email: userEmail, teamId }),
        });

        const user = await userRes.json();
        if (!user.id) throw new Error("User creation failed");

        const sessionRes = await fetch("http://localhost:4243/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, userId: user.id, amount: parseFloat(amount) }),
        });
        const session = await sessionRes.json();
        if (!session.url) throw new Error("Checkout session failed");

        window.location.href = session.url;
    } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
    }
    }

return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Donate Here!</h2>
        <p className="mb-4 text-gray-700">Donate funds to help your sorority or fraternity! Buy a Shirt!</p>

        <div className="mb-6">
            <a 
                href="shirt link"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                target="_blank" rel="noopener noreferrer"
            >
                Buy a Shirt!
            </a>
        </div>

        <form onSubmit={handleSuubmit} className="space-y-4">
            <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
            className="w-full p-2 border rounded"
            >
                <option value="">Select Your Team</option>
                {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                        {team.name}
                    </option>
                ))}
            </select>

            <input
            type="text"
            placeholder="Full Name"
            className="w-full p-2 border rounded"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            />

            <input
            type="email"
            placeholder="Your email address"
            className="w-full p-2 border rounded"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            />

            <input
            type="number"
            step="0.01"
            min="1"
            placeholder="Donation amount (USD)"
            className="w-full p-2 border rounded"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"       
        >
            {loading ? "Processing..." : "Send Money with Stripe"}
        </button>
        </form>
    </div>
);
};

export default Donate;
