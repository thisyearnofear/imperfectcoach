// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @dev Minimal on-chain registry for discovering and pricing agents in the x402 economy.
 *
 * Purpose:
 * - Store agent profiles (endpoint, capabilities, pricing)
 * - Enable agent discovery queries
 * - Track agent reputation and uptime
 * - Facilitate agent-to-agent payment negotiation
 *
 * Design:
 * - Lightweight: Only essential data on-chain
 * - Reap Protocol compatible: Works alongside Reap for real agent discovery
 * - x402 optimized: Supports per-request pricing negotiation
 * - Multi-chain ready: Deploy on Avalanche Fuji + Base Sepolia
 */

contract AgentRegistry {
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────────
    
    enum Capability {
        FITNESS_ANALYSIS,
        NUTRITION_PLANNING,
        BIOMECHANICS_ANALYSIS,
        RECOVERY_PLANNING,
        CALENDAR_COORDINATION,
        MASSAGE_BOOKING,
        BENCHMARK_ANALYSIS
    }
    
    enum ServiceTier {
        BASIC,
        PRO,
        PREMIUM
    }
    
    struct AgentProfile {
        address walletAddress;
        string name;
        string endpoint;           // Public URL for calling agent
        Capability[] capabilities;
        
        // Pricing per capability
        mapping(Capability => uint256) baseFeeUSDC;    // In USDC wei
        mapping(Capability => mapping(ServiceTier => uint256)) tieredFeeUSDC;
        
        // Reputation
        uint256 reputationScore;   // 0-100
        uint256 totalRequests;
        uint256 successfulRequests;
        uint256 lastHeartbeat;
        
        // Status
        bool active;
        bool blacklisted;
    }
    
    struct AgentInfo {
        address walletAddress;
        string name;
        string endpoint;
        Capability[] capabilities;
        uint256 reputationScore;
        uint256 uptime;            // 0-100 percentage
        bool active;
    }
    
    struct PricingInfo {
        Capability capability;
        uint256 baseFeeUSDC;
        uint256[3] tieredFeesUSDC; // [basic, pro, premium]
    }
    
    // ─────────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────────
    
    address public owner;
    
    mapping(address => AgentProfile) public agents;
    address[] public agentAddresses;
    
    // Capability → agents offering it
    mapping(Capability => address[]) public capabilityAgents;
    
    uint256 public registrationFeeUSDC = 1e6; // 1 USDC
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────────
    
    event AgentRegistered(address indexed agent, string name);
    event AgentUpdated(address indexed agent);
    event AgentBlacklisted(address indexed agent, string reason);
    event AgentWhitelisted(address indexed agent);
    event HeartbeatReceived(address indexed agent, uint256 timestamp);
    event PricingUpdated(address indexed agent, Capability capability, uint256 baseFee);
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────────
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyAgent() {
        require(agents[msg.sender].active && !agents[msg.sender].blacklisted, "Agent not registered or blacklisted");
        _;
    }
    
    modifier agentExists(address _agent) {
        require(agents[_agent].active, "Agent does not exist");
        _;
    }
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────────
    
    constructor() {
        owner = msg.sender;
    }
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Agent Registration & Management
    // ─────────────────────────────────────────────────────────────────────────────
    
    /**
     * Register a new agent (self-service)
     * Agent registers themselves with their profile and initial pricing
     */
    function registerAgent(
        string memory _name,
        string memory _endpoint,
        Capability[] memory _capabilities,
        uint256[] memory _baseFees
    ) external {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_endpoint).length > 0, "Endpoint required");
        require(_capabilities.length > 0, "At least one capability required");
        require(_baseFees.length == _capabilities.length, "Fee count mismatch");
        require(!agents[msg.sender].active, "Already registered");
        
        AgentProfile storage agent = agents[msg.sender];
        agent.walletAddress = msg.sender;
        agent.name = _name;
        agent.endpoint = _endpoint;
        agent.active = true;
        agent.reputationScore = 50; // Start neutral
        agent.lastHeartbeat = block.timestamp;
        
        // Set capabilities and pricing
        for (uint i = 0; i < _capabilities.length; i++) {
            agent.capabilities.push(_capabilities[i]);
            agent.baseFeeUSDC[_capabilities[i]] = _baseFees[i];
            
            // Add to capability index
            if (!_isInArray(capabilityAgents[_capabilities[i]], msg.sender)) {
                capabilityAgents[_capabilities[i]].push(msg.sender);
            }
        }
        
        agentAddresses.push(msg.sender);
        
        emit AgentRegistered(msg.sender, _name);
    }
    
    /**
     * Update agent pricing for a capability
     */
    function updatePricing(
        Capability _capability,
        uint256 _baseFeeUSDC,
        uint256 _basicTierUSDC,
        uint256 _proTierUSDC,
        uint256 _premiumTierUSDC
    ) external onlyAgent {
        AgentProfile storage agent = agents[msg.sender];
        
        agent.baseFeeUSDC[_capability] = _baseFeeUSDC;
        agent.tieredFeeUSDC[_capability][ServiceTier.BASIC] = _basicTierUSDC;
        agent.tieredFeeUSDC[_capability][ServiceTier.PRO] = _proTierUSDC;
        agent.tieredFeeUSDC[_capability][ServiceTier.PREMIUM] = _premiumTierUSDC;
        
        emit PricingUpdated(msg.sender, _capability, _baseFeeUSDC);
    }
    
    /**
     * Update reputation score (called by orchestrator after SLA verification)
     */
    function updateReputation(
        address _agent,
        uint256 _newScore
    ) external onlyOwner agentExists(_agent) {
        require(_newScore <= 100, "Score must be 0-100");
        agents[_agent].reputationScore = _newScore;
        agents[_agent].successfulRequests++;
        agents[_agent].totalRequests++;
    }
    
    /**
     * Record a heartbeat (agent is online)
     */
    function heartbeat() external onlyAgent {
        agents[msg.sender].lastHeartbeat = block.timestamp;
        emit HeartbeatReceived(msg.sender, block.timestamp);
    }
    
    /**
     * Blacklist an agent (owner only)
     */
    function blacklistAgent(address _agent, string memory _reason) external onlyOwner {
        agents[_agent].blacklisted = true;
        agents[_agent].active = false;
        emit AgentBlacklisted(_agent, _reason);
    }
    
    /**
     * Whitelist an agent (remove blacklist)
     */
    function whitelistAgent(address _agent) external onlyOwner {
        agents[_agent].blacklisted = false;
        agents[_agent].active = true;
        emit AgentWhitelisted(_agent);
    }
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Agent Discovery Queries
    // ─────────────────────────────────────────────────────────────────────────────
    
    /**
     * Find agents offering a specific capability
     * Returns agents sorted by reputation score (highest first)
     */
    function findAgentsByCapability(Capability _capability) 
        external 
        view 
        returns (AgentInfo[] memory) 
    {
        address[] memory candidates = capabilityAgents[_capability];
        
        // Filter active agents
        address[] memory activeAgents = new address[](candidates.length);
        uint256 count = 0;
        
        for (uint i = 0; i < candidates.length; i++) {
            if (agents[candidates[i]].active && !agents[candidates[i]].blacklisted) {
                activeAgents[count] = candidates[i];
                count++;
            }
        }
        
        // Build result array
        AgentInfo[] memory results = new AgentInfo[](count);
        
        for (uint i = 0; i < count; i++) {
            address agentAddr = activeAgents[i];
            AgentProfile storage agent = agents[agentAddr];
            
            results[i] = AgentInfo({
                walletAddress: agentAddr,
                name: agent.name,
                endpoint: agent.endpoint,
                capabilities: agent.capabilities,
                reputationScore: agent.reputationScore,
                uptime: _calculateUptime(agent),
                active: agent.active
            });
        }
        
        // Sort by reputation (bubble sort - minimal for small arrays)
        _sortByReputation(results);
        
        return results;
    }
    
    /**
     * Get pricing for a specific agent & capability
     */
    function getAgentPricing(address _agent, Capability _capability)
        external
        view
        agentExists(_agent)
        returns (PricingInfo memory)
    {
        AgentProfile storage agent = agents[_agent];
        
        uint256 basicFee = agent.tieredFeeUSDC[_capability][ServiceTier.BASIC];
        uint256 proFee = agent.tieredFeeUSDC[_capability][ServiceTier.PRO];
        uint256 premiumFee = agent.tieredFeeUSDC[_capability][ServiceTier.PREMIUM];
        
        // Fallback to base fee if tiers not set
        if (basicFee == 0) basicFee = agent.baseFeeUSDC[_capability];
        if (proFee == 0) proFee = basicFee * 2;
        if (premiumFee == 0) premiumFee = basicFee * 5;
        
        return PricingInfo({
            capability: _capability,
            baseFeeUSDC: agent.baseFeeUSDC[_capability],
            tieredFeesUSDC: [basicFee, proFee, premiumFee]
        });
    }
    
    /**
     * Get full profile for an agent
     */
    function getAgent(address _agent)
        external
        view
        agentExists(_agent)
        returns (AgentInfo memory)
    {
        AgentProfile storage agent = agents[_agent];
        
        return AgentInfo({
            walletAddress: _agent,
            name: agent.name,
            endpoint: agent.endpoint,
            capabilities: agent.capabilities,
            reputationScore: agent.reputationScore,
            uptime: _calculateUptime(agent),
            active: agent.active
        });
    }
    
    /**
     * Get all registered agents
     */
    function getAllAgents() external view returns (AgentInfo[] memory) {
        AgentInfo[] memory results = new AgentInfo[](agentAddresses.length);
        
        for (uint i = 0; i < agentAddresses.length; i++) {
            AgentProfile storage agent = agents[agentAddresses[i]];
            if (!agent.blacklisted) {
                results[i] = AgentInfo({
                    walletAddress: agentAddresses[i],
                    name: agent.name,
                    endpoint: agent.endpoint,
                    capabilities: agent.capabilities,
                    reputationScore: agent.reputationScore,
                    uptime: _calculateUptime(agent),
                    active: agent.active
                });
            }
        }
        
        return results;
    }
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    
    function _calculateUptime(AgentProfile storage _agent) internal view returns (uint256) {
        uint256 timeSinceHeartbeat = block.timestamp - _agent.lastHeartbeat;
        
        // If heartbeat in last hour: 100%
        if (timeSinceHeartbeat < 3600) return 100;
        // If heartbeat in last day: 80%
        if (timeSinceHeartbeat < 86400) return 80;
        // If heartbeat in last week: 50%
        if (timeSinceHeartbeat < 604800) return 50;
        // Otherwise: 0%
        return 0;
    }
    
    function _isInArray(address[] memory _array, address _value) internal pure returns (bool) {
        for (uint i = 0; i < _array.length; i++) {
            if (_array[i] == _value) return true;
        }
        return false;
    }
    
    function _sortByReputation(AgentInfo[] memory _agents) internal pure {
        uint256 n = _agents.length;
        for (uint i = 0; i < n; i++) {
            for (uint j = 0; j < n - i - 1; j++) {
                if (_agents[j].reputationScore < _agents[j + 1].reputationScore) {
                    // Swap
                    AgentInfo memory temp = _agents[j];
                    _agents[j] = _agents[j + 1];
                    _agents[j + 1] = temp;
                }
            }
        }
    }
}
