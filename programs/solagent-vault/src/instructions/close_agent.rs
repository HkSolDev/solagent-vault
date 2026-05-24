use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<CloseAgent>, agent_id: u64) -> Result<()> {
    let agent = &ctx.accounts.agent_state;
    let vault = &mut ctx.accounts.vault_state;

    // Sweep remaining balance if any to the owner ATA
    if agent.balance > 0 {
        let amount = agent.balance;
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
    }

    // Decrement agent count in vault
    vault.agent_count = vault.agent_count.checked_sub(1).ok_or(error!(ErrorCode::Overflow))?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct CloseAgent<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault_state.bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        close = owner,
        seeds = [b"agent", vault_state.key().as_ref(), agent_id.to_le_bytes().as_ref()],
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
