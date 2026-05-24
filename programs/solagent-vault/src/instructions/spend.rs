use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<Spend>, amount: u64, agent_id: u64) -> Result<()> {
    let agent = &mut ctx.accounts.agent_state;
    let current_time = Clock::get()?.unix_timestamp;

    // GUARD 1: Status Check
    require!(
        agent.status == AgentStatus::Active,
        ErrorCode::AgentNotActive
    );

    // GUARD 2: Allowlist Check
    let mut is_allowed = true;
    let mut has_allowlist = false;
    for provider in agent.allowed_providers.iter() {
        if *provider != Pubkey::default() {
            has_allowlist = true;
            if *provider == ctx.accounts.provider_wallet.key() {
                is_allowed = true;
                break;
            } else {
                is_allowed = false;
            }
        }
    }
    if has_allowlist {
        require!(is_allowed, ErrorCode::ProviderNotAllowed);
    }

    // GUARD 3: Single-call Cap Check
    require!(
        amount <= agent.max_per_call,
        ErrorCode::ExceedsMaxPerCall
    );

    // GUARD 4: Rate Limit Check (Per-minute window)
    if current_time - agent.last_window_start >= 60 {
        // New window starts, reset counters
        agent.last_window_start = current_time;
        agent.spent_this_window = 0;
    }

    let new_spent = agent.spent_this_window.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;
    require!(
        new_spent <= agent.max_per_minute,
        ErrorCode::ExceedsRateLimit
    );

    // GUARD 5: Balance Check
    require!(
        agent.balance >= amount,
        ErrorCode::InsufficientBalance
    );

    // All guards passed! Execute CPI USDC Transfer from Agent ATA to Provider ATA
    let vault_key = agent.vault;
    let agent_id_bytes = agent_id.to_le_bytes();
    let seeds = &[
        b"agent",
        vault_key.as_ref(),
        agent_id_bytes.as_ref(),
        &[agent.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.agent_token_account.to_account_info(),
        to: ctx.accounts.provider_token_account.to_account_info(),
        authority: ctx.accounts.agent_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    // Update states
    agent.balance = agent.balance.checked_sub(amount).ok_or(error!(ErrorCode::Overflow))?;
    agent.spent_this_window = new_spent;
    agent.total_spent = agent.total_spent.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;

    emit!(SpendEvent {
        agent: agent.key(),
        provider: ctx.accounts.provider_wallet.key(),
        amount,
        timestamp: current_time,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, agent_id: u64)]
pub struct Spend<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent_state.vault.as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        constraint = agent_state.agent_signer == agent_signer.key()
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub agent_signer: Signer<'info>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    /// CHECK: Target API Provider wallet
    pub provider_wallet: AccountInfo<'info>,

    #[account(
        mut,
        constraint = provider_token_account.owner == provider_wallet.key()
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
