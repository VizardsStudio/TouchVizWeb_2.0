export async function sendMessage(message: string) {
    const res = await fetch("https://touchviz-agent-nawas-1.onrender.com/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });
    return await res.json();
}
