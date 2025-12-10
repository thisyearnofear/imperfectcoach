export class AgentClient {
    /**
     * Execute a remote agent call with automatic x402 payment handling vs local simulated server
     */
    static async call(endpoint, payload, agentWallet) {
        console.log(`📡 AgentClient: Calling ${endpoint}...`);

        // 1. Initial Request (No payment)
        // We simulate the server call by invoking the imported handler directly
        // In a real scenario, this would be fetch(endpoint, ...)

        // We need to dynamic import the handler to avoid circular dependencies if this were a real module structure,
        // but for this test script we can pass the handler function or assume it's imported.
        // For this implementation, we will assume 'handler' is passed as 'endpoint' if it's a function, 
        // or we fetch if string.

        let response;

        if (typeof endpoint === 'function') {
            // Local simulation
            response = await endpoint({
                httpMethod: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });
        } else {
            // Real fetch implementation could go here
            throw new Error("Only local function simulation supported for this test");
        }

        // 2. Check for 402
        if (response.statusCode === 402) {
            console.log("💰 AgentClient: Payment Required (402) detected");
            const body = JSON.parse(response.body);
            const challenge = body.challenge;

            console.log(`   - Cost: ${parseInt(challenge.amount) / 1000000} ${challenge.asset === "USDC" ? "USDC" : "tokens"}`);
            console.log(`   - PayTo: ${challenge.payTo}`);

            // 3. Sign Payment
            // In a real scenario, we use the agent's private key.
            // Here we mock the signature generation since the server side is also mocked to verify=true.

            const paymentPayload = {
                scheme: challenge.scheme,
                network: challenge.network,
                asset: challenge.asset,
                amount: challenge.amount,
                chainId: challenge.chainId,
                payTo: challenge.payTo,
                payer: agentWallet.address,
                timestamp: Math.floor(Date.now() / 1000),
                nonce: Math.random().toString(36),
                signature: "valid-agent-signature-123", // MOCKED
                message: "x402 Agent Payment"
            };

            const paymentHeader = btoa(JSON.stringify(paymentPayload));
            console.log("📦 AgentClient: Generated x402 Payment Header");

            // 4. Retry Request
            console.log("🔄 AgentClient: Retrying check with payment...");

            if (typeof endpoint === 'function') {
                response = await endpoint({
                    httpMethod: "POST",
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "application/json",
                        "X-Payment": paymentHeader,
                        "X-Chain": challenge.network
                    }
                });
            }
        }

        // 5. Parse Final Result
        if (response.statusCode === 200 || response.statusCode === 201) {
            return JSON.parse(response.body);
        } else {
            throw new Error(`Agent Call Failed: ${response.statusCode} - ${response.body}`);
        }
    }
}
