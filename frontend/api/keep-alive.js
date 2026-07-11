export default async function handler(req, res) {
  try {
    // Ping Node.js Backend (Replace with your actual URL)
    await fetch("https://your-node-backend.onrender.com/health");
    
    // Ping Python ML Backend (Replace with your actual URL)
    await fetch("https://your-python-backend.onrender.com/health");
    
    res.status(200).json({ message: "Backends successfully pinged!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to ping backends" });
  }
}