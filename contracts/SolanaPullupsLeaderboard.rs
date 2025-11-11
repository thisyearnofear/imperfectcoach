// Solana Pullups Leaderboard Program
// Mirrors ExerciseLeaderboard.sol structure for pullups exercise specifically

use anchor_lang::prelude::*;

declare_id!("GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa");

#[program]
pub mod solana_pullups_leaderboard {
    use super::*;

    // Initialize a new pullups leaderboard
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        leaderboard.exercise_name = "pullups".to_string();
        leaderboard.total_participants = 0;
        leaderboard.total_submissions = 0;
        Ok(())
    }

    // Submit a pullups score for a user
    pub fn submit_score(
        ctx: Context<SubmitScore>,
        score: u32,
    ) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        let user_score = &mut ctx.accounts.user_score;
        let user_pubkey = ctx.accounts.user.key();

        let score_u64 = score as u64;
        let is_new_user = user_score.submission_count == 0;

        // Update user score data
        user_score.user = user_pubkey;
        user_score.total_score += score_u64;
        user_score.submission_count += 1;
        user_score.last_submission_time = Clock::get()?.unix_timestamp as u64;

        if is_new_user {
            user_score.first_submission_time = Clock::get()?.unix_timestamp as u64;
            leaderboard.total_participants += 1;
        }

        // Update best single score
        if score_u64 > user_score.best_single_score {
            user_score.best_single_score = score_u64;
        }

        leaderboard.total_submissions += 1;

        // Emit event
        emit!(ScoreSubmitted {
            user: user_pubkey,
            score_added: score_u64,
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
            submission_count: user_score.submission_count,
            last_submission_time: user_score.last_submission_time,
            first_submission_time: user_score.first_submission_time,
        })
    }

    // Get leaderboard stats
    pub fn get_stats(ctx: Context<GetStats>) -> Result<LeaderboardStats> {
        let leaderboard = &ctx.accounts.leaderboard;
        Ok(LeaderboardStats {
            exercise_name: leaderboard.exercise_name.clone(),
            total_participants: leaderboard.total_participants,
            total_submissions: leaderboard.total_submissions,
        })
    }
}

// ========================= ACCOUNTS =========================

#[account]
pub struct Leaderboard {
    pub exercise_name: String,      // "pullups"
    pub total_participants: u64,    // Number of unique users
    pub total_submissions: u64,     // Total number of submissions
}

#[account]
pub struct UserScore {
    pub user: Pubkey,                   // User's wallet address
    pub total_score: u64,               // Cumulative pullups score
    pub best_single_score: u64,         // Best single pullups submission
    pub submission_count: u64,          // Number of submissions
    pub last_submission_time: u64,      // Unix timestamp
    pub first_submission_time: u64,     // Unix timestamp
}

// ========================= CONTEXTS =========================

#[derive(Accounts)]
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
        init_if_needed,
        payer = user,
        space = 8 + 144,
        seeds = [b"user_score", leaderboard.key().as_ref(), user.key().as_ref()],
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
    pub submission_count: u64,
    pub last_submission_time: u64,
    pub first_submission_time: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LeaderboardStats {
    pub exercise_name: String,
    pub total_participants: u64,
    pub total_submissions: u64,
}