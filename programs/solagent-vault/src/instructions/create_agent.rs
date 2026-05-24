use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

pub fn handler(
    ctx: Context<CreateAgent>,
    agent_id: u64,
    agent_signer: Pubkey,
    max_per_call: u64,
    max_per_minute: u64,
    allowed_providers: [Pubkey; 5],
) -> Result<()> {
    let agent = &mut ctx.accounts.agent_state;
    agent.vault = ctx.accounts.vault_state.key();
    agent.owner = ctx.accounts.owner.key();
    agent.agent_signer = agent_signer;
    agent.balance = 0;
    agent.status = AgentStatus::Active;
    agent.max_per_call = max_per_call;
    agent.max_per_minute = max_per_minute;
    agent.last_window_start = Clock::get()?.unix_timestamp;
    agent.spent_this_window = 0;
    agent.total_spent = 0;
    agent.allowed_providers = allowed_providers;
    agent.bump = ctx.bumps.agent_state;

    // Increment agent count
    let vault = &mut ctx.accounts.vault_state;
    vault.agent_count = vault.agent_count.checked_add(1).ok_or(error!(ErrorCode::Overflow))?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct CreateAgent<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault_state.bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 8 + 8 + 8 + 8 + 8 + (32 * 5) + 1,
        seeds = [b"agent", vault_state.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
