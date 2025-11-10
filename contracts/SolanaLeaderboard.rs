// Solana Leaderboard Program
// Matches ExerciseLeaderboard.sol structure for unified display

use anchor_lang::prelude::*;
use std::cmp::Ordering;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod solana_leaderboard {
    use super::*;

    // Initialize a new leaderboard
    pub fn initialize(ctx: Context<Initialize>, exercise_name: String) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        leaderboard.exercise_name = exercise_name;
        leaderboard.total_participants = 0;
        leaderboard.total_submissions = 0;
        Ok(())
    }

    // Submit a score for a user
    pub fn submit_score(
        ctx: Context<SubmitScore>,
        pullups: u32,
        jumps: u32,
    ) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        let user_score = &mut ctx.accounts.user_score;
        let user_pubkey = ctx.accounts.user.key();

        let score = (pullups as u64) + (jumps as u64);
        
        let is_new_user = user_score.submission_count == 0;

        // Update user score data
        user_score.user = user_pubkey;
        user_score.total_score += score;
        user_score.pullups += pullups as u64;
        user_score.jumps += jumps as u64;
        user_score.submission_count += 1;
        user_score.last_submission_time = Clock::get()?.unix_timestamp as u64;

        if is_new_user {
            user_score.first_submission_time = Clock::get()?.unix_timestamp as u64;
            leaderboard.total_participants += 1;
        }

        // Update best single score
        if score > user_score.best_single_score {
            user_score.best_single_score = score;
        }

        leaderboard.total_submissions += 1;

        // Emit event
        emit!(ScoreSubmitted {
            user: user_pubkey,
            score_added: score,
            new_total_score: user_score.total_score,
            new_best_score: user_score.best_single_score,
            timestamp: user_score.last_submission_time,
        });

        Ok(())
    }

    // Get a user's score
    pub fn get_user_score(ctx: Context<GetUserScore>) -> Result<UserScoreData> {
        let user_score = &ctx.accounts.user_score;
        Ok(UserScoreData {
            user: user_score.user,
            total_score: user_score.total_score,
            best_single_score: user_score.best_single_score,
            pullups: user_score.pullups,
            jumps: user_score.jumps,
            submission_count: user_score.submission_count,
            last_submission_time: user_score.last_submission_time,
            first_submission_time: user_score.first_submission_time,
        })
    }

    // Get leaderboard stats
    pub fn get_stats(ctx: Context<GetStats>) -> Result<LeaderboardStats> {
        let leaderboard = &ctx.accounts.leaderboard;
        Ok(LeaderboardStats {
            total_participants: leaderboard.total_participants,
            total_submissions: leaderboard.total_submissions,
        })
    }
}

// ========================= ACCOUNTS =========================

#[account]
pub struct Leaderboard {
    pub exercise_name: String,      // e.g., "pullups" or "jumps"
    pub total_participants: u64,    // Number of unique users
    pub total_submissions: u64,     // Total number of submissions
}

#[account]
pub struct UserScore {
    pub user: Pubkey,                   // User's wallet address
    pub total_score: u64,               // Cumulative score
    pub best_single_score: u64,         // Best single submission
    pub pullups: u64,                   // Total pullups submitted
    pub jumps: u64,                     // Total jumps submitted
    pub submission_count: u64,          // Number of submissions
    pub last_submission_time: u64,      // Unix timestamp
    pub first_submission_time: u64,     // Unix timestamp
}

// ========================= CONTEXTS =========================

#[derive(Accounts)]
#[instruction(exercise_name: String)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 256)]
    pub leaderboard: Account<'info, Leaderboard>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(mut)]
    pub leaderboard: Account<'info, Leaderboard>,
    #[account(
        mut,
        seeds = [b"user_score", user.key().as_ref()],
        bump
    )]
    pub user_score: Account<'info, UserScore>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetUserScore<'info> {
    pub user_score: Account<'info, UserScore>,
}

#[derive(Accounts)]
pub struct GetStats<'info> {
    pub leaderboard: Account<'info, Leaderboard>,
}

// ========================= EVENTS =========================

#[event]
pub struct ScoreSubmitted {
    pub user: Pubkey,
    pub score_added: u64,
    pub new_total_score: u64,
    pub new_best_score: u64,
    pub timestamp: u64,
}

// ========================= DATA TYPES =========================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UserScoreData {
    pub user: Pubkey,
    pub total_score: u64,
    pub best_single_score: u64,
    pub pullups: u64,
    pub jumps: u64,
    pub submission_count: u64,
    pub last_submission_time: u64,
    pub first_submission_time: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LeaderboardStats {
    pub total_participants: u64,
    pub total_submissions: u64,
}
