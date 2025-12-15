// Solana Agent Registry Program
// Manages agent discovery, capabilities, and pricing on Solana

use anchor_lang::prelude::*;

declare_id!("9u4eVWRf8a7vMDCHsguakB6vxcnCuJssBVBbQAYrKdog"); // Deployed Devnet ID

#[program]
pub mod solana_agent_registry {
    use super::*;

    // Register a new agent profile
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        endpoint: String,
        capabilities: Vec<String>,
    ) -> Result<()> {
        let agent_profile = &mut ctx.accounts.agent_profile;
        agent_profile.authority = ctx.accounts.authority.key();
        agent_profile.name = name;
        agent_profile.endpoint = endpoint;
        agent_profile.capabilities = capabilities;
        agent_profile.reputation_score = 0; // Starts at 0
        agent_profile.total_jobs = 0;
        agent_profile.registered_at = Clock::get()?.unix_timestamp;
        agent_profile.is_active = true;
        Ok(())
    }

    // Update agent pricing
    pub fn update_pricing(
        ctx: Context<UpdateAgent>,
        base_fee: u64,
        asset_mint: Pubkey,
    ) -> Result<()> {
        let agent_profile = &mut ctx.accounts.agent_profile;
        // Verify authority
        require!(agent_profile.authority == ctx.accounts.authority.key(), AgentError::Unauthorized);

        agent_profile.base_fee = base_fee;
        agent_profile.asset_mint = asset_mint;
        Ok(())
    }

    // Update agent reputation (only callable by authorized reporter/oracle)
    // Simplified: self-reporting or anyone can report for demo (In prod: protect this)
    pub fn report_job_completion(
        ctx: Context<ReportJob>,
        success: bool,
    ) -> Result<()> {
        let agent_profile = &mut ctx.accounts.agent_profile;
        agent_profile.total_jobs += 1;
        if success {
            // Simple reputation increment
            agent_profile.reputation_score = agent_profile.reputation_score.saturating_add(1);
        }
        Ok(())
    }
}

// ========================= ACCOUNTS =========================

#[account]
pub struct AgentProfile {
    pub authority: Pubkey,          // The agent's wallet
    pub name: String,               // Agent name
    pub endpoint: String,           // HTTP Endpoint for interactions
    pub capabilities: Vec<String>,  // Capabilities tags
    pub base_fee: u64,              // Base fee in atomic units
    pub asset_mint: Pubkey,         // Token usage (USDC)
    pub reputation_score: u64,      // Reputation points
    pub total_jobs: u64,            // Total jobs processed
    pub registered_at: i64,         // Registration timestamp
    pub is_active: bool,            // Status
}

// ========================= CONTEXTS =========================

#[derive(Accounts)]
#[instruction(name: String, endpoint: String, capabilities: Vec<String>)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 64 + 128 + (4 + 20 * 32) + 8 + 32 + 8 + 8 + 8 + 1, // Approx space calculation
        seeds = [b"agent_profile", authority.key().as_ref()],
        bump
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent_profile", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReportJob<'info> {
    #[account(mut)]
    pub agent_profile: Account<'info, AgentProfile>,
    pub reporter: Signer<'info>, // In prod, check if reporter is authorized
}

// ========================= ERRORS =========================

#[error_code]
pub enum AgentError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
