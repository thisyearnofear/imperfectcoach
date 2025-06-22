// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RevenueSplitter
 * @dev This contract splits incoming payments among a predefined set of beneficiaries.
 * It is designed to be the central hub for the Imperfect Coach platform's revenue,
 * aligning with the autonomous economic loop described in the HACKATHON_PLAN.md.
 *
 * It leverages OpenZeppelin's secure PaymentSplitter and is controlled by an owner
 * (intended to be the CoachOperator contract or a secure admin wallet), who has the
 * sole authority to trigger the distribution of funds.
 *
 * The beneficiaries and their respective shares are set at deployment time.
 * For example:
 * - 70% to the Platform Treasury (for AI costs)
 * - 20% to a User Rewards pool
 * - 10% to a Referrer pool
 *
 * The contract is payable and can receive funds from any source, primarily intended
 * to be the destination for x402pay payments.
 */
contract RevenueSplitter is PaymentSplitter, Ownable {
    /**
     * @dev Creates a RevenueSplitter contract.
     * @param payees The addresses of the beneficiaries.
     * @param shares_ The respective shares of the beneficiaries.
     * @param initialOwner The address that will have ownership of this contract.
     *        This should be the CoachOperator or a secure multi-sig wallet.
     */
    constructor(
        address[] memory payees,
        uint256[] memory shares_,
        address initialOwner
    ) PaymentSplitter(payees, shares_) payable Ownable(initialOwner) {
        // The constructor initializes the PaymentSplitter with the beneficiaries and their shares,
        // and sets the initial owner who can manage the contract.
    }

    /**
     * @dev The `release` function from PaymentSplitter is already available to each payee
     * to withdraw their share. This contract does not need a custom `distribute` function,
     * as the standard `release` function is more gas-efficient and allows payees to pull
     * funds at their convenience.
     *
     * Only the owner (e.g., CoachOperator) can perform administrative tasks if any were added,
     * but fund withdrawal is decentralized to the payees themselves.
     */
}