use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<Withdraw>, amount: u64, agent_id: u64) -> Result<()> {
    let agent = &mut ctx.accounts.agent_state;
    require!(
        agent.balance >= amount,
        ErrorCode::InsufficientBalance
    );

    // CPI transfer from Agent ATA back to owner ATA
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
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: ctx.accounts.agent_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    agent.balance = agent.balance.checked_sub(amount).ok_or(error!(ErrorCode::Overflow))?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, agent_id: u64)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent_state.vault.as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        has_one = owner
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
