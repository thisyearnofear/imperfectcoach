// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RevenueSplitter
 * @dev Enhanced payment splitter with booking escrow and SLA enforcement.
 * 
 * Phase D Enhancements:
 * - Booking escrow for agent service payments
 * - Automatic SLA enforcement with penalties
 * - Multi-agent payment coordination
 * - Agent reputation tracking
 * 
 * Core functionality:
 * - Splits incoming payments among beneficiaries (platform, rewards, referrers)
 * - Manages booking escrow and settlements
 * - Enforces SLA penalties and automatic refunds
 * - Tracks agent performance and reputation
 */
contract RevenueSplitter is PaymentSplitter, Ownable {
    
    // ─────────────────────────────────────────────────────────────────
    // Type Definitions
    // ─────────────────────────────────────────────────────────────────
    
    enum BookingStatus { Pending, Active, Completed, Cancelled, SLABreached }
    
    struct ServiceBooking {
        uint256 bookingId;
        address agent;
        address customer;
        uint256 amount;
        uint256 slaDurationMs; // Service SLA in milliseconds
        uint256 startTime;
        uint256 expiryTime;
        BookingStatus status;
        bool refunded;
    }
    
    struct AgentReputation {
        address agent;
        uint256 totalBookings;
        uint256 successfulBookings;
        uint256 slaBreaches;
        uint256 totalEarnings;
        bool blacklisted;
    }
    
    // ─────────────────────────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────────────────────────
    
    mapping(uint256 => ServiceBooking) public bookings;
    mapping(address => AgentReputation) public agentReputations;
    mapping(address => uint256[]) public agentBookings;
    
    uint256 private bookingCounter;
    uint256 public slaBreachPenaltyPercent = 10; // 10% penalty for SLA breach
    
    // ─────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────
    
    event BookingCreated(
        uint256 indexed bookingId,
        address indexed agent,
        address indexed customer,
        uint256 amount,
        uint256 slaDurationMs
    );
    
    event BookingCompleted(
        uint256 indexed bookingId,
        address indexed agent,
        uint256 agentPayout
    );
    
    event BookingCancelled(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 refundAmount
    );
    
    event SLABreached(
        uint256 indexed bookingId,
        address indexed agent,
        uint256 penaltyAmount
    );
    
    event AgentReputationUpdated(
        address indexed agent,
        uint256 successRate
    );
    
    // ─────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────
    
    constructor(
        address[] memory payees,
        uint256[] memory shares_,
        address initialOwner
    ) PaymentSplitter(payees, shares_) payable Ownable(initialOwner) {
        bookingCounter = 1;
    }

    // ─────────────────────────────────────────────────────────────────
    // Booking Management (Phase D)
    // ─────────────────────────────────────────────────────────────────
    
    /**
     * @dev Create a new service booking with escrow
     * Called when customer wants to book an agent service
     */
    function createBooking(
        address agent,
        uint256 slaDurationMs,
        uint256 expiryTime
    ) external payable returns (uint256) {
        require(msg.value > 0, "Payment required");
        require(!agentReputations[agent].blacklisted, "Agent blacklisted");
        require(expiryTime > block.timestamp, "Invalid expiry time");
        
        uint256 bookingId = bookingCounter++;
        
        ServiceBooking storage booking = bookings[bookingId];
        booking.bookingId = bookingId;
        booking.agent = agent;
        booking.customer = msg.sender;
        booking.amount = msg.value;
        booking.slaDurationMs = slaDurationMs;
        booking.startTime = block.timestamp;
        booking.expiryTime = expiryTime;
        booking.status = BookingStatus.Pending;
        booking.refunded = false;
        
        agentBookings[agent].push(bookingId);
        
        emit BookingCreated(
            bookingId,
            agent,
            msg.sender,
            msg.value,
            slaDurationMs
        );
        
        return bookingId;
    }
    
    /**
     * @dev Complete a booking and release payment to agent
     * Called when agent successfully completes service
     */
    function completeBooking(uint256 bookingId) external onlyOwner {
        ServiceBooking storage booking = bookings[bookingId];
        require(booking.status == BookingStatus.Active, "Invalid booking status");
        require(!booking.refunded, "Already refunded");
        
        // Check if SLA was met
        uint256 completionTime = block.timestamp - booking.startTime;
        bool slaBreached = completionTime > booking.slaDurationMs;
        
        uint256 agentPayout = booking.amount;
        
        if (slaBreached) {
            // Apply SLA breach penalty
            uint256 penalty = (booking.amount * slaBreachPenaltyPercent) / 100;
            agentPayout = booking.amount - penalty;
            
            booking.status = BookingStatus.SLABreached;
            agentReputations[booking.agent].slaBreaches++;
            
            emit SLABreached(bookingId, booking.agent, penalty);
        } else {
            booking.status = BookingStatus.Completed;
        }
        
        // Update agent reputation
        agentReputations[booking.agent].totalBookings++;
        if (!slaBreached) {
            agentReputations[booking.agent].successfulBookings++;
        }
        agentReputations[booking.agent].totalEarnings += agentPayout;
        
        emit AgentReputationUpdated(
            booking.agent,
            (agentReputations[booking.agent].successfulBookings * 100) / 
            agentReputations[booking.agent].totalBookings
        );
        
        // Transfer payout to agent
        (bool success, ) = payable(booking.agent).call{value: agentPayout}("");
        require(success, "Payment to agent failed");
        
        emit BookingCompleted(bookingId, booking.agent, agentPayout);
    }
    
    /**
     * @dev Cancel booking and refund customer
     * Called if service cannot be completed or customer withdraws
     */
    function cancelBooking(uint256 bookingId) external {
        ServiceBooking storage booking = bookings[bookingId];
        require(
            msg.sender == booking.customer || msg.sender == owner(),
            "Only customer or owner can cancel"
        );
        require(!booking.refunded, "Already refunded");
        require(booking.status != BookingStatus.Completed, "Cannot cancel completed booking");
        
        booking.status = BookingStatus.Cancelled;
        booking.refunded = true;
        
        uint256 refundAmount = booking.amount;
        
        // Transfer refund to customer
        (bool success, ) = payable(booking.customer).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit BookingCancelled(bookingId, booking.customer, refundAmount);
    }
    
    /**
     * @dev Auto-refund if booking expires without completion
     * Can be called by anyone after expiry time
     */
    function refundExpiredBooking(uint256 bookingId) external {
        ServiceBooking storage booking = bookings[bookingId];
        require(block.timestamp > booking.expiryTime, "Booking not expired");
        require(!booking.refunded, "Already refunded");
        require(booking.status != BookingStatus.Completed, "Cannot refund completed");
        
        booking.status = BookingStatus.Cancelled;
        booking.refunded = true;
        
        uint256 refundAmount = booking.amount;
        
        (bool success, ) = payable(booking.customer).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit BookingCancelled(bookingId, booking.customer, refundAmount);
    }
    
    /**
     * @dev Get agent reputation metrics
     */
    function getAgentReputation(address agent) 
        external 
        view 
        returns (
            uint256 totalBookings,
            uint256 successfulBookings,
            uint256 slaBreaches,
            uint256 totalEarnings,
            uint256 successRate
        ) 
    {
        AgentReputation memory rep = agentReputations[agent];
        return (
            rep.totalBookings,
            rep.successfulBookings,
            rep.slaBreaches,
            rep.totalEarnings,
            rep.totalBookings > 0 ? (rep.successfulBookings * 100) / rep.totalBookings : 0
        );
    }
    
    /**
     * @dev Blacklist unreliable agents
     */
    function blacklistAgent(address agent) external onlyOwner {
        agentReputations[agent].blacklisted = true;
    }
    
    /**
     * @dev Remove agent from blacklist
     */
    function whitelistAgent(address agent) external onlyOwner {
        agentReputations[agent].blacklisted = false;
    }
    
    /**
     * @dev Update SLA breach penalty (0-100%)
     */
    function setSLABreachPenalty(uint256 percent) external onlyOwner {
        require(percent <= 100, "Invalid percentage");
        slaBreachPenaltyPercent = percent;
    }
    
    /**
     * @dev Get booking details
     */
    function getBooking(uint256 bookingId) 
        external 
        view 
        returns (
            address agent,
            address customer,
            uint256 amount,
            BookingStatus status,
            bool refunded
        ) 
    {
        ServiceBooking memory booking = bookings[bookingId];
        return (
            booking.agent,
            booking.customer,
            booking.amount,
            booking.status,
            booking.refunded
        );
    }
}