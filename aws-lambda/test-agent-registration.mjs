/**
 * Test Agent Registration with Signature Verification
 * 
 * This script tests the permissionless agent registration flow with EIP-191 signatures
 * 
 * Usage:
 *   node test-agent-registration.mjs [environment]
 *   node test-agent-registration.mjs local
 *   node test-agent-registration.mjs dev
 */

import { signMessage, privateKeyToAccount } from 'viem/accounts';
import { toBytes } from 'viem';
import { AgentRegistry, initializeRegistry } from './lib/agents.mjs';

const ENVIRONMENT = process.argv[2] || 'local';
const API_BASE = ENVIRONMENT === 'local' 
    ? 'http://localhost:3001'
    : `https://api-${ENVIRONMENT}.imperfectcoach.app`;

/**
 * Test 1: EVM Agent Registration (Base Sepolia)
 */
async function testEVMRegistration() {
    console.log('\n========================================');
    console.log('Test 1: EVM Agent Registration (Base Sepolia)');
    console.log('========================================\n');

    // Generate test agent with private key
    // In production: agents would use their own wallets
    const privateKey = '0x' + '1'.repeat(64); // Test private key (DO NOT USE IN PRODUCTION)
    const account = privateKeyToAccount(privateKey);

    const agentId = `test-evm-agent-${Date.now()}`;
    const agentProfile = {
        id: agentId,
        name: 'Test EVM Agent',
        endpoint: `https://test-agent-${Date.now()}.example.com/x402`,
        capabilities: ['test_capability'],
        pricing: {
            test_capability: {
                baseFee: '0.001',
                asset: 'USDC',
                chain: 'base-sepolia'
            }
        },
        signer: account.address,
        chain: 'evm',
        timestamp: Math.floor(Date.now() / 1000)
    };

    // Create message to sign
    const message = JSON.stringify({
        agentId: agentProfile.id,
        endpoint: agentProfile.endpoint,
        timestamp: agentProfile.timestamp
    });

    // Sign message
    const signature = await signMessage({
        account,
        message
    });

    console.log('✓ Agent profile created');
    console.log(`  ID: ${agentProfile.id}`);
    console.log(`  Signer: ${agentProfile.signer}`);
    console.log(`  Signature: ${signature.slice(0, 20)}...`);

    // Test 1a: Register via local registry
    console.log('\n▶ Registering with local registry...');
    try {
        const registry = new AgentRegistry(null); // No DynamoDB for test
        const registered = await registry.register(agentProfile, signature);
        
        console.log('✅ Local registration successful');
        console.log(`  Type: ${registered.type}`);
        console.log(`  Status: ${registered.status}`);
        console.log(`  Verified: ${registered.verifiedAt ? 'Yes' : 'No'}`);
    } catch (error) {
        console.error('❌ Local registration failed:', error.message);
        return false;
    }

    // Test 1b: Register via REST API (if running locally)
    if (ENVIRONMENT === 'local') {
        console.log('\n▶ Registering via REST API...');
        try {
            const response = await fetch(`${API_BASE}/agents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: agentProfile,
                    signature
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ REST API registration successful');
            console.log(`  Agent ID: ${result.agent.id}`);
            console.log(`  Note: ${result.note}`);
        } catch (error) {
            console.error('❌ REST API registration failed:', error.message);
            return false;
        }
    }

    return true;
}

/**
 * Test 1b: Solana Agent Registration (Ed25519)
 */
async function testSolanaRegistration() {
    console.log('\n========================================');
    console.log('Test 1b: Solana Agent Registration (Ed25519)');
    console.log('========================================\n');

    // Import Solana utilities
    const { Keypair, PublicKey } = await import('@solana/web3.js');
    const bs58 = await import('bs58');
    const nacl = await import('tweetnacl');

    // Generate test keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKey = keypair.secretKey;

    const agentId = `test-solana-agent-${Date.now()}`;
    const agentProfile = {
        id: agentId,
        name: 'Test Solana Agent',
        endpoint: `https://test-sol-agent-${Date.now()}.example.com/x402`,
        capabilities: ['fitness_analysis'],
        pricing: {
            fitness_analysis: {
                baseFee: '0.05',
                asset: 'USDC',
                chain: 'solana-devnet'
            }
        },
        signer: publicKey,
        chain: 'solana',
        timestamp: Math.floor(Date.now() / 1000)
    };

    // Create message to sign
    const message = JSON.stringify({
        agentId: agentProfile.id,
        endpoint: agentProfile.endpoint,
        timestamp: agentProfile.timestamp
    });

    // Sign with Ed25519
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.default.sign.detached(messageBytes, secretKey);
    const signatureB58 = bs58.default.encode(signature);

    console.log('✓ Solana agent created');
    console.log(`  ID: ${agentProfile.id}`);
    console.log(`  Signer: ${publicKey}`);
    console.log(`  Signature: ${signatureB58.slice(0, 20)}...`);

    // Test 1b: Register via local registry
    console.log('\n▶ Registering with local registry...');
    try {
        const registry = new AgentRegistry(null);
        const registered = await registry.register(agentProfile, signatureB58);
        
        console.log('✅ Solana registration successful');
        console.log(`  Type: ${registered.type}`);
        console.log(`  Status: ${registered.status}`);
        console.log(`  Chain: ${registered.chain}`);
        console.log(`  Verified: ${registered.verifiedAt ? 'Yes' : 'No'}`);
    } catch (error) {
        console.error('❌ Solana registration failed:', error.message);
        return false;
    }

    return true;
}

/**
 * Test 2: Agent Discovery After Registration
 */
async function testDiscovery() {
    console.log('\n========================================');
    console.log('Test 2: Agent Discovery');
    console.log('========================================\n');

    const registry = new AgentRegistry(null);
    
    // Query by capability
    const agents = await registry.queryByCapability('test_capability');
    
    console.log(`✓ Found ${agents.length} agents with 'test_capability'`);
    agents.forEach((agent, i) => {
        console.log(`  ${i + 1}. ${agent.name} (${agent.type})`);
        console.log(`     - ID: ${agent.id}`);
        console.log(`     - Reputation: ${agent.reputationScore}/100`);
    });

    return true;
}

/**
 * Test 3: Heartbeat & Persistence
 */
async function testHeartbeat() {
    console.log('\n========================================');
    console.log('Test 3: Heartbeat & Liveness');
    console.log('========================================\n');

    const registry = new AgentRegistry(null);
    
    // Get a core agent
    const coreAgent = registry.getAll()[0];
    if (!coreAgent) {
        console.error('❌ No agents found');
        return false;
    }

    console.log(`▶ Testing heartbeat for: ${coreAgent.name}`);
    
    const before = coreAgent.lastHeartbeat;
    
    // Send heartbeat
    await new Promise(r => setTimeout(r, 100));
    await registry.updateHeartbeat(coreAgent.id);
    
    const updated = registry.getById(coreAgent.id);
    const after = updated.lastHeartbeat;
    
    if (after > before) {
        console.log('✅ Heartbeat updated successfully');
        console.log(`  Before: ${new Date(before).toISOString()}`);
        console.log(`  After:  ${new Date(after).toISOString()}`);
        return true;
    } else {
        console.error('❌ Heartbeat was not updated');
        return false;
    }
}

/**
 * Test 4: Stale Agent Detection
 */
async function testStaleDetection() {
    console.log('\n========================================');
    console.log('Test 4: Stale Agent Detection');
    console.log('========================================\n');

    const registry = new AgentRegistry(null);
    
    // Create stale agent
    const staleAgent = {
        id: 'test-stale-agent',
        name: 'Stale Agent',
        endpoint: 'http://offline-agent.example.com',
        type: 'dynamic',
        lastHeartbeat: Date.now() - (4 * 3600 * 1000), // 4 hours ago
        capabilities: ['test'],
        status: 'active'
    };
    
    registry.agents.set(staleAgent.id, staleAgent);
    
    // Find stale agents (threshold: 1 hour)
    const staleAgents = registry.findStaleAgents(3600000);
    
    console.log(`✓ Checked for stale agents (threshold: 1 hour)`);
    console.log(`  Found ${staleAgents.length} stale agent(s)`);
    
    if (staleAgents.includes('test-stale-agent')) {
        console.log('✅ Stale agent correctly identified');
        return true;
    } else {
        console.error('❌ Stale agent not detected');
        return false;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Agent Registry - Phase 2 Tests                        ║');
    console.log('║  Environment:', ENVIRONMENT.padEnd(40) + '║');
    console.log('╚════════════════════════════════════════════════════════╝');

    const tests = [
        { name: 'EVM Registration', fn: testEVMRegistration },
        { name: 'Solana Registration', fn: testSolanaRegistration },
        { name: 'Agent Discovery', fn: testDiscovery },
        { name: 'Heartbeat', fn: testHeartbeat },
        { name: 'Stale Detection', fn: testStaleDetection }
    ];

    const results = [];
    
    for (const test of tests) {
        try {
            const passed = await test.fn();
            results.push({ test: test.name, passed });
        } catch (error) {
            console.error(`\n❌ Test "${test.name}" threw error:`, error.message);
            results.push({ test: test.name, passed: false });
        }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Test Summary                                          ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    const passed = results.filter(r => r.passed).length;
    results.forEach(r => {
        const icon = r.passed ? '✅' : '❌';
        console.log(`║ ${icon} ${r.test.padEnd(50)} ║`);
    });
    
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Passed: ${passed}/${results.length}`.padEnd(58) + '║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    process.exit(passed === results.length ? 0 : 1);
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
